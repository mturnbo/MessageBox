package handlers_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"messagebox-api-go/internal/handlers"
)

func TestHealth_UP(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.GET("/v1/health", handlers.Health)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/v1/health", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}

	var body map[string]any
	if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if body["status"] != "UP" {
		t.Errorf("status = %v, want UP", body["status"])
	}
	if body["database"] != "Connected" {
		t.Errorf("database = %v, want Connected", body["database"])
	}
}
