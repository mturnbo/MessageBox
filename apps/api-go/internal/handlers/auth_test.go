package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"messagebox-api-go/internal/handlers"
	"messagebox-api-go/internal/middleware"
	"messagebox-api-go/internal/models"

	"golang.org/x/crypto/bcrypt"
)

func TestLogin_ValidCredentials_ReturnsTokens(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	os.Setenv("JWT_EXPIRATION_TIME", "1h")
	os.Setenv("JWT_REFRESH_EXPIRATION_TIME", "168h")

	db := newTestDB(t)
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 10)
	db.Create(&models.User{
		Username:     "alice",
		Email:        "alice@example.com",
		PasswordHash: string(hash),
		FirstName:    "Test",
		LastName:     "User",
	})

	r := newTestRouter()
	r.POST("/v1/auth", handlers.Login)

	body := `{"username":"alice","password":"password123"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/auth", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
	var resp map[string]any
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["token"] == nil || resp["token"] == "" {
		t.Error("expected token in response")
	}
	if resp["refreshToken"] == nil || resp["refreshToken"] == "" {
		t.Error("expected refreshToken in response")
	}
	if resp["username"] != "alice" {
		t.Errorf("username = %v, want alice", resp["username"])
	}
}

func TestLogin_WrongPassword_Returns401(t *testing.T) {
	db := newTestDB(t)
	hash, _ := bcrypt.GenerateFromPassword([]byte("correct"), 10)
	db.Create(&models.User{
		Username:     "bob",
		Email:        "bob@example.com",
		PasswordHash: string(hash),
		FirstName:    "Bob",
		LastName:     "Test",
	})

	r := newTestRouter()
	r.POST("/v1/auth", handlers.Login)

	body := `{"username":"bob","password":"wrong"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/auth", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestLogin_UnknownUser_Returns401(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.POST("/v1/auth", handlers.Login)

	body := `{"username":"ghost","password":"anything"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/auth", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestLogin_MissingPassword_Returns400(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.POST("/v1/auth", handlers.Login)

	body := `{"username":"alice"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/auth", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestRefreshToken_ValidToken_ReturnsNewAccessToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	os.Setenv("JWT_EXPIRATION_TIME", "1h")

	refreshTok, _ := middleware.CreateRefreshToken("alice", "test-secret", "168h")

	newTestDB(t)
	r := newTestRouter()
	r.POST("/v1/auth/refresh", handlers.RefreshToken)

	body, _ := json.Marshal(map[string]string{"refreshToken": refreshTok})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/auth/refresh", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
	var resp map[string]any
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["token"] == nil || resp["token"] == "" {
		t.Error("expected token in response")
	}
}

func TestRefreshToken_AccessTokenAsRefresh_Returns401(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")

	accessTok, _ := middleware.CreateAccessToken("alice", "test-secret", "1h")

	newTestDB(t)
	r := newTestRouter()
	r.POST("/v1/auth/refresh", handlers.RefreshToken)

	body, _ := json.Marshal(map[string]string{"refreshToken": accessTok})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/auth/refresh", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401 (access token is not a refresh token)", w.Code)
	}
}
