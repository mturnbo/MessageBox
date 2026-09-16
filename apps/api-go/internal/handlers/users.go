package handlers

import (
	"net/http"
	"strconv"

	"messagebox-api-go/internal/database"
	"messagebox-api-go/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func GetUsers(c *gin.Context) {
	var limit, page int
	if c.Param("limit") != "" {
		limit, _ = strconv.Atoi(c.Param("limit"))
		page, _ = strconv.Atoi(c.Param("page"))
	} else {
		limit, _ = strconv.Atoi(c.DefaultQuery("limit", "10"))
		page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	}
	if limit <= 0 {
		limit = 10
	}
	if page <= 0 {
		page = 1
	}

	var users []models.User
	database.DB.Limit(limit).Offset((page - 1) * limit).Find(&users)
	c.JSON(http.StatusOK, users)
}

func GetUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := database.DB.
		Where("id = ? OR username = ? OR email = ?", id, id, id).
		First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

type createUserRequest struct {
	Username      string  `json:"username"      binding:"required"`
	Email         string  `json:"email"         binding:"required"`
	Password      string  `json:"password"      binding:"required"`
	FirstName     string  `json:"firstName"     binding:"required"`
	LastName      string  `json:"lastName"      binding:"required"`
	DeviceAddress *string `json:"deviceAddress"`
}

func CreateUser(c *gin.Context) {
	var req createUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to hash password"})
		return
	}

	user := models.User{
		Username:      req.Username,
		Email:         req.Email,
		PasswordHash:  string(hash),
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		DeviceAddress: req.DeviceAddress,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Username or email already exists"})
		return
	}
	c.JSON(http.StatusOK, user)
}

type updateUserRequest struct {
	ID         uint `json:"id" binding:"required"`
	UserUpdate struct {
		Username      *string `json:"username"`
		Email         *string `json:"email"`
		Password      *string `json:"password"`
		FirstName     *string `json:"firstName"`
		LastName      *string `json:"lastName"`
		DeviceAddress *string `json:"deviceAddress"`
	} `json:"userUpdate" binding:"required"`
}

func UpdateUser(c *gin.Context) {
	var req updateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.First(&user, req.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	updates := map[string]any{}
	u := req.UserUpdate
	if u.Username != nil      { updates["username"] = *u.Username }
	if u.Email != nil         { updates["email"] = *u.Email }
	if u.FirstName != nil     { updates["first_name"] = *u.FirstName }
	if u.LastName != nil      { updates["last_name"] = *u.LastName }
	if u.DeviceAddress != nil { updates["device_address"] = *u.DeviceAddress }
	if u.Password != nil {
		hash, _ := bcrypt.GenerateFromPassword([]byte(*u.Password), 10)
		updates["password_hash"] = string(hash)
	}

	database.DB.Model(&user).Updates(updates)
	c.JSON(http.StatusOK, user)
}

func DeleteUser(c *gin.Context) {
	result := database.DB.Delete(&models.User{}, c.Param("id"))
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}
	c.Status(http.StatusNoContent)
}
