package handlers_test

import (
	"testing"

	"messagebox-api-go/internal/database"
	"messagebox-api-go/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	if err := db.AutoMigrate(
		&models.User{},
		&models.Message{},
		&models.Thread{},
		&models.ThreadMessage{},
	); err != nil {
		t.Fatalf("automigrate failed: %v", err)
	}
	database.DB = db
	return db
}

func newTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}
