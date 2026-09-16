// apps/api-go/cmd/server/main.go
package main

import (
	"log"
	"net/http"
	"os"

	"messagebox-api-go/internal/config"
	"messagebox-api-go/internal/database"
	"messagebox-api-go/internal/handlers"
	"messagebox-api-go/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		os.Exit(1)
	}

	if err := database.Connect(cfg); err != nil {
		log.Fatalf("[DATABASE] %v", err)
	}

	r := gin.Default()

	if cfg.Origin != "" {
		r.Use(corsMiddleware("http://localhost:" + cfg.Origin))
	}

	v1 := r.Group("/v1")

	v1.GET("/health", handlers.Health)

	auth := v1.Group("/auth")
	auth.POST("", handlers.Login)
	auth.POST("/refresh", handlers.RefreshToken)

	users := v1.Group("/users", middleware.RequireAuth())
	users.GET("", handlers.GetUsers)
	users.GET("/:id/:page", handlers.GetUsers)
	users.GET("/:id", handlers.GetUser)
	users.POST("/register", handlers.CreateUser)
	users.POST("/update", handlers.UpdateUser)
	users.DELETE("/delete/:id", handlers.DeleteUser)

	// Named sub-paths must be registered before /:id wildcards
	msgs := v1.Group("/messages", middleware.RequireAuth())
	msgs.GET("/inbox", handlers.GetInbox)
	msgs.GET("/sent", handlers.GetSent)
	msgs.GET("/:id/thread", handlers.GetThread)
	msgs.GET("/:id", handlers.GetMessage)
	msgs.POST("/post", handlers.CreateMessage)
	msgs.POST("/reply", handlers.ReplyToMessage)
	msgs.POST("/read", handlers.ReadMessage)
	msgs.POST("/delete", handlers.DeleteMessage)

	log.Printf("[SERVER] Listening on :%s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatalf("[SERVER] %v", err)
	}
}

func corsMiddleware(allowedOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", allowedOrigin)
		c.Header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,Idempotency-Key")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
