package handlers

import (
	"net/http"
	"strconv"
	"time"

	"messagebox-api-go/internal/database"
	"messagebox-api-go/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func GetInbox(c *gin.Context) {
	recipientID, _ := strconv.Atoi(c.Query("recipientId"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if recipientID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "recipientId is required"})
		return
	}

	var msgs []models.Message
	var total int64
	base := database.DB.Model(&models.Message{}).
		Where("recipient_id = ? AND deleted_by_recipient IS NULL", recipientID)
	base.Count(&total)
	base.Order("sent_at DESC").Limit(limit).Offset((page - 1) * limit).Find(&msgs)

	c.JSON(http.StatusOK, gin.H{"messages": msgs, "total": total, "page": page, "limit": limit})
}

func GetSent(c *gin.Context) {
	senderID, _ := strconv.Atoi(c.Query("senderId"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if senderID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "senderId is required"})
		return
	}

	var msgs []models.Message
	var total int64
	base := database.DB.Model(&models.Message{}).
		Where("sender_id = ? AND deleted_by_sender IS NULL", senderID)
	base.Count(&total)
	base.Order("sent_at DESC").Limit(limit).Offset((page - 1) * limit).Find(&msgs)

	c.JSON(http.StatusOK, gin.H{"messages": msgs, "total": total, "page": page, "limit": limit})
}

func GetMessage(c *gin.Context) {
	msgID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid id"})
		return
	}
	var msg models.Message
	if err := database.DB.First(&msg, "id = ?", msgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Message not found"})
		return
	}
	c.JSON(http.StatusOK, msg)
}

func GetThread(c *gin.Context) {
	originID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid id"})
		return
	}
	var thread models.Thread
	if err := database.DB.Where("origin_msg = ?", originID).First(&thread).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Thread not found"})
		return
	}

	var links []models.ThreadMessage
	database.DB.Where("thread_id = ?", thread.ID).Find(&links)

	ids := []uint{thread.OriginMsg}
	for _, l := range links {
		ids = append(ids, l.MsgID)
	}

	var msgs []models.Message
	database.DB.Where("id IN ?", ids).Order("sent_at ASC").Find(&msgs)
	c.JSON(http.StatusOK, gin.H{"threadId": thread.ID, "messages": msgs})
}

type createMessageRequest struct {
	SenderID        uint    `json:"senderId"        binding:"required"`
	RecipientID     uint    `json:"recipientId"     binding:"required"`
	Subject         *string `json:"subject"`
	Body            *string `json:"body"`
	SenderAddress   *string `json:"senderAddress"`
	ClientMessageID *string `json:"clientMessageId"`
}

func CreateMessage(c *gin.Context) {
	var req createMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	clientID := resolveClientID(req.ClientMessageID, c.GetHeader("Idempotency-Key"))

	var existing models.Message
	if err := database.DB.Where("client_message_id = ?", clientID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"message": existing, "idempotencyReplayed": true})
		return
	}

	msg := models.Message{
		SenderID: req.SenderID, RecipientID: req.RecipientID,
		Subject: req.Subject, Body: req.Body,
		SenderAddress: req.SenderAddress, ClientMessageID: &clientID,
	}
	if err := database.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to create message"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": msg, "idempotencyReplayed": false})
}

type replyRequest struct {
	ReplyToID       uint    `json:"replyToId"       binding:"required"`
	SenderID        uint    `json:"senderId"        binding:"required"`
	RecipientID     uint    `json:"recipientId"     binding:"required"`
	Subject         *string `json:"subject"`
	Body            *string `json:"body"`
	SenderAddress   *string `json:"senderAddress"`
	ClientMessageID *string `json:"clientMessageId"`
}

func ReplyToMessage(c *gin.Context) {
	var req replyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	var original models.Message
	if err := database.DB.First(&original, req.ReplyToID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Original message not found"})
		return
	}

	clientID := resolveClientID(req.ClientMessageID, "")

	var existing models.Message
	if err := database.DB.Where("client_message_id = ?", clientID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"message": existing, "idempotencyReplayed": true})
		return
	}

	msg := models.Message{
		SenderID: req.SenderID, RecipientID: req.RecipientID,
		Subject: req.Subject, Body: req.Body,
		SenderAddress: req.SenderAddress, ClientMessageID: &clientID,
	}
	if err := database.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to create reply"})
		return
	}

	var thread models.Thread
	if err := database.DB.Where("origin_msg = ?", req.ReplyToID).First(&thread).Error; err != nil {
		thread = models.Thread{OriginMsg: req.ReplyToID}
		database.DB.Create(&thread)
	}
	database.DB.Create(&models.ThreadMessage{
		ThreadID: thread.ID,
		MsgID:    msg.ID,
		ReplyTo:  req.ReplyToID,
	})

	c.JSON(http.StatusOK, gin.H{
		"message":             msg,
		"threadId":            thread.ID,
		"replyTo":             req.ReplyToID,
		"idempotencyReplayed": false,
	})
}

type readMessageRequest struct {
	ID            uint    `json:"id" binding:"required"`
	ReaderAddress *string `json:"readerAddress"`
}

func ReadMessage(c *gin.Context) {
	var req readMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	var msg models.Message
	if err := database.DB.First(&msg, req.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Message not found"})
		return
	}
	updates := map[string]any{"read_at": time.Now()}
	if req.ReaderAddress != nil {
		updates["reader_address"] = *req.ReaderAddress
	}
	database.DB.Model(&msg).Updates(updates)
	c.JSON(http.StatusOK, msg)
}

type deleteMessageRequest struct {
	ID        uint `json:"id"        binding:"required"`
	DeletedBy uint `json:"deletedBy" binding:"required"`
}

func DeleteMessage(c *gin.Context) {
	var req deleteMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	var msg models.Message
	if err := database.DB.First(&msg, req.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Message not found"})
		return
	}
	now := time.Now()
	if req.DeletedBy == msg.SenderID {
		database.DB.Model(&msg).Update("deleted_by_sender", now)
	} else {
		database.DB.Model(&msg).Update("deleted_by_recipient", now)
	}
	c.JSON(http.StatusOK, msg)
}

func resolveClientID(bodyKey *string, header string) string {
	if bodyKey != nil && *bodyKey != "" {
		return *bodyKey
	}
	if header != "" {
		return header
	}
	return uuid.NewString()
}
