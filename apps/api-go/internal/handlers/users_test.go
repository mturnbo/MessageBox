package handlers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"messagebox-api-go/internal/handlers"
	"messagebox-api-go/internal/models"

	"golang.org/x/crypto/bcrypt"
)

func seedUser(t *testing.T, username string) models.User {
	t.Helper()
	db := newTestDB(t)
	hash, _ := bcrypt.GenerateFromPassword([]byte("password"), 10)
	user := models.User{
		Username:     username,
		Email:        username + "@example.com",
		PasswordHash: string(hash),
		FirstName:    "Test",
		LastName:     "User",
	}
	db.Create(&user)
	return user
}

func TestGetUsers_ReturnsArray(t *testing.T) {
	seedUser(t, "alice")
	r := newTestRouter()
	r.GET("/v1/users", handlers.GetUsers)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/v1/users?limit=10&page=1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	var body []map[string]any
	json.NewDecoder(w.Body).Decode(&body)
	if len(body) == 0 {
		t.Error("expected at least one user")
	}
}

func TestGetUser_ByID_ReturnsUser(t *testing.T) {
	user := seedUser(t, "carol")
	r := newTestRouter()
	r.GET("/v1/users/:id", handlers.GetUser)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/v1/users/%d", user.ID), nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	var body map[string]any
	json.NewDecoder(w.Body).Decode(&body)
	if body["username"] != "carol" {
		t.Errorf("username = %v, want carol", body["username"])
	}
}

func TestGetUser_ByUsername_ReturnsUser(t *testing.T) {
	seedUser(t, "dave")
	r := newTestRouter()
	r.GET("/v1/users/:id", handlers.GetUser)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/v1/users/dave", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
}

func TestGetUser_NotFound_Returns404(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.GET("/v1/users/:id", handlers.GetUser)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/v1/users/99999", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", w.Code)
	}
}

func TestCreateUser_ValidPayload_ReturnsUser(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.POST("/v1/users/register", handlers.CreateUser)

	payload := `{"username":"newuser","email":"new@example.com","password":"pass123","firstName":"New","lastName":"User"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/users/register", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
	var body map[string]any
	json.NewDecoder(w.Body).Decode(&body)
	if body["username"] != "newuser" {
		t.Errorf("username = %v, want newuser", body["username"])
	}
	if body["PasswordHash"] != nil {
		t.Error("password hash must not be in response (json:\"-\" tag)")
	}
}

func TestCreateUser_DuplicateUsername_Returns400(t *testing.T) {
	seedUser(t, "duplicate")
	r := newTestRouter()
	r.POST("/v1/users/register", handlers.CreateUser)

	payload := `{"username":"duplicate","email":"other@example.com","password":"pass","firstName":"A","lastName":"B"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/users/register", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestUpdateUser_ValidPayload_Returns200(t *testing.T) {
	user := seedUser(t, "updateme")
	r := newTestRouter()
	r.POST("/v1/users/update", handlers.UpdateUser)

	payload := fmt.Sprintf(`{"id":%d,"userUpdate":{"firstName":"Updated"}}`, user.ID)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/users/update", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
}

func TestDeleteUser_ExistingID_Returns204(t *testing.T) {
	user := seedUser(t, "deleteme")
	r := newTestRouter()
	r.DELETE("/v1/users/delete/:id", handlers.DeleteUser)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("/v1/users/delete/%d", user.ID), nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("status = %d, want 204", w.Code)
	}
}

func TestDeleteUser_NotFound_Returns404(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.DELETE("/v1/users/delete/:id", handlers.DeleteUser)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodDelete, "/v1/users/delete/99999", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", w.Code)
	}
}
