package handlers

import (
	"net/http"
	"os"
	"time"

	"messagebox-api-go/internal/database"
	"messagebox-api-go/internal/middleware"
	"messagebox-api-go/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Username == "" && req.Email == "") {
		c.JSON(http.StatusBadRequest, gin.H{"message": "username or email, and password are required"})
		return
	}

	var user models.User
	q := database.DB
	if req.Username != "" {
		q = q.Where("username = ?", req.Username)
	} else {
		q = q.Where("email = ?", req.Email)
	}
	if err := q.First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid credentials"})
		return
	}

	database.DB.Model(&user).Update("last_login", time.Now())

	secret := os.Getenv("JWT_SECRET")
	accessToken, err := middleware.CreateAccessToken(user.Username, secret, os.Getenv("JWT_EXPIRATION_TIME"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create token"})
		return
	}
	refreshToken, err := middleware.CreateRefreshToken(user.Username, secret, os.Getenv("JWT_REFRESH_EXPIRATION_TIME"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"username":     user.Username,
		"token":        accessToken,
		"refreshToken": refreshToken,
	})
}

type refreshRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

func RefreshToken(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "refreshToken is required"})
		return
	}

	claims, err := middleware.ParseToken(req.RefreshToken, os.Getenv("JWT_SECRET"))
	if err != nil || claims.Type != "refresh" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid refresh token"})
		return
	}

	token, err := middleware.CreateAccessToken(claims.Username, os.Getenv("JWT_SECRET"), os.Getenv("JWT_EXPIRATION_TIME"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}
