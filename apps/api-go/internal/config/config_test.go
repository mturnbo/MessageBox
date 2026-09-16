package config

import (
	"os"
	"testing"
)

func setRequiredEnv() func() {
	vars := map[string]string{
		"MYSQL_USER":          "dbuser",
		"MYSQL_PASSWORD":      "dbpass",
		"MYSQL_DATABASE":      "testdb",
		"JWT_SECRET":          "testsecret",
		"JWT_EXPIRATION_TIME": "1h",
	}
	for k, v := range vars {
		os.Setenv(k, v)
	}
	return func() {
		for k := range vars {
			os.Unsetenv(k)
		}
	}
}

func TestLoad_AllRequired_ReturnsConfig(t *testing.T) {
	cleanup := setRequiredEnv()
	defer cleanup()

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.DBUser != "dbuser" {
		t.Errorf("expected DBUser=dbuser, got %s", cfg.DBUser)
	}
	if cfg.JWTSecret != "testsecret" {
		t.Errorf("expected JWTSecret=testsecret, got %s", cfg.JWTSecret)
	}
}

func TestLoad_Defaults(t *testing.T) {
	cleanup := setRequiredEnv()
	defer cleanup()
	os.Unsetenv("MYSQL_HOST")
	os.Unsetenv("SERVER_PORT")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cfg.DBHost != "localhost" {
		t.Errorf("expected DBHost=localhost, got %s", cfg.DBHost)
	}
	if cfg.ServerPort != "3001" {
		t.Errorf("expected ServerPort=3001, got %s", cfg.ServerPort)
	}
}

func TestLoad_MissingRequired_ReturnsError(t *testing.T) {
	os.Unsetenv("MYSQL_USER")
	os.Unsetenv("MYSQL_PASSWORD")
	os.Unsetenv("MYSQL_DATABASE")
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("JWT_EXPIRATION_TIME")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing env vars, got nil")
	}
}
