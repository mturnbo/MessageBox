package config

import (
	"fmt"
	"os"
)

type Config struct {
	ServerPort           string
	DBUser               string
	DBPassword           string
	DBHost               string
	DBPort               string
	DBDatabase           string
	JWTSecret            string
	JWTExpirationTime    string
	JWTRefreshExpiration string
	Origin               string
}

var required = []string{
	"MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE",
	"JWT_SECRET", "JWT_EXPIRATION_TIME",
}

func Load() (*Config, error) {
	var missing []string
	for _, key := range required {
		if os.Getenv(key) == "" {
			missing = append(missing, key)
		}
	}
	if len(missing) > 0 {
		for _, k := range missing {
			fmt.Fprintf(os.Stderr, "[CONFIG] Missing required env var: %s\n", k)
		}
		return nil, fmt.Errorf("startup aborted: %d required env var(s) missing", len(missing))
	}
	return &Config{
		ServerPort:           getEnv("SERVER_PORT", "3001"),
		DBUser:               os.Getenv("MYSQL_USER"),
		DBPassword:           os.Getenv("MYSQL_PASSWORD"),
		DBHost:               getEnv("MYSQL_HOST", "localhost"),
		DBPort:               getEnv("MYSQL_PORT", "3306"),
		DBDatabase:           os.Getenv("MYSQL_DATABASE"),
		JWTSecret:            os.Getenv("JWT_SECRET"),
		JWTExpirationTime:    os.Getenv("JWT_EXPIRATION_TIME"),
		JWTRefreshExpiration: getEnv("JWT_REFRESH_EXPIRATION_TIME", "168h"),
		Origin:               os.Getenv("ORIGIN"),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
