package handlers

import (
	"net/http"

	"messagebox-api-go/internal/database"

	"github.com/gin-gonic/gin"
)

func Health(c *gin.Context) {
	sqlDB, err := database.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "DOWN",
			"database": "Disconnected",
		})
		return
	}
	stats := sqlDB.Stats()
	c.JSON(http.StatusOK, gin.H{
		"status":   "UP",
		"database": "Connected",
		"pool": gin.H{
			"open":  stats.OpenConnections,
			"inUse": stats.InUse,
			"idle":  stats.Idle,
		},
	})
}
