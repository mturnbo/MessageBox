package middleware

import (
	"testing"
	"time"
)

const testSecret = "test-jwt-secret"

func TestCreateAccessToken_ReturnsNonEmptyToken(t *testing.T) {
	token, err := CreateAccessToken("alice", testSecret, "1h")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
}

func TestParseToken_ValidAccessToken(t *testing.T) {
	token, _ := CreateAccessToken("alice", testSecret, "1h")
	claims, err := ParseToken(token, testSecret)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if claims.Username != "alice" {
		t.Errorf("Username = %q, want %q", claims.Username, "alice")
	}
	if claims.Type != "" {
		t.Errorf("Type = %q, want empty string for access token", claims.Type)
	}
}

func TestParseToken_ValidRefreshToken(t *testing.T) {
	token, _ := CreateRefreshToken("bob", testSecret, "168h")
	claims, err := ParseToken(token, testSecret)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if claims.Username != "bob" {
		t.Errorf("Username = %q, want %q", claims.Username, "bob")
	}
	if claims.Type != "refresh" {
		t.Errorf("Type = %q, want %q", claims.Type, "refresh")
	}
}

func TestParseToken_WrongSecret_ReturnsError(t *testing.T) {
	token, _ := CreateAccessToken("alice", testSecret, "1h")
	_, err := ParseToken(token, "wrong-secret")
	if err == nil {
		t.Fatal("expected error for wrong secret, got nil")
	}
}

func TestParseToken_ExpiredToken_ReturnsError(t *testing.T) {
	token, _ := CreateAccessToken("alice", testSecret, "-1s")
	time.Sleep(10 * time.Millisecond)
	_, err := ParseToken(token, testSecret)
	if err == nil {
		t.Fatal("expected error for expired token, got nil")
	}
}

func TestParseToken_MalformedToken_ReturnsError(t *testing.T) {
	_, err := ParseToken("not.a.jwt", testSecret)
	if err == nil {
		t.Fatal("expected error for malformed token, got nil")
	}
}
