package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"messagebox-api-go/internal/middleware"

	"github.com/gin-gonic/gin"
)

func setupAuthRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/protected", middleware.RequireAuth(), func(c *gin.Context) {
		username, _ := c.Get("username")
		c.JSON(http.StatusOK, gin.H{"username": username})
	})
	return r
}

func mintToken(t *testing.T, username, tokenType string) string {
	t.Helper()
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "test-secret"
		os.Setenv("JWT_SECRET", secret)
	}
	if tokenType == "refresh" {
		tok, _ := middleware.CreateRefreshToken(username, secret, "168h")
		return tok
	}
	tok, _ := middleware.CreateAccessToken(username, secret, "1h")
	return tok
}

func TestRequireAuth_NoHeader_Returns401(t *testing.T) {
	r := setupAuthRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestRequireAuth_ValidToken_PassesThrough(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	r := setupAuthRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+mintToken(t, "alice", "access"))
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}
}

func TestRequireAuth_RefreshToken_Returns401(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	r := setupAuthRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+mintToken(t, "alice", "refresh"))
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401 (refresh token should be rejected)", w.Code)
	}
}

func TestRequireAuth_InvalidToken_Returns401(t *testing.T) {
	r := setupAuthRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer not.a.real.token")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}
