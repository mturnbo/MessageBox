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
)

func seedMessage(t *testing.T, senderID, recipientID uint) models.Message {
	t.Helper()
	db := newTestDB(t)
	clientID := "test-client-id-" + fmt.Sprint(senderID)
	msg := models.Message{
		SenderID:        senderID,
		RecipientID:     recipientID,
		ClientMessageID: &clientID,
	}
	db.Create(&msg)
	return msg
}

func TestGetInbox_ReturnsPaginatedMessages(t *testing.T) {
	msg := seedMessage(t, 1, 2)
	r := newTestRouter()
	r.GET("/v1/messages/inbox", handlers.GetInbox)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/v1/messages/inbox?recipientId=%d", msg.RecipientID), nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	var body map[string]any
	json.NewDecoder(w.Body).Decode(&body)
	if body["messages"] == nil {
		t.Error("expected messages key in response")
	}
	if body["total"] == nil {
		t.Error("expected total key in response")
	}
}

func TestGetInbox_MissingRecipientID_Returns400(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.GET("/v1/messages/inbox", handlers.GetInbox)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/v1/messages/inbox", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestGetSent_ReturnsSentMessages(t *testing.T) {
	msg := seedMessage(t, 3, 4)
	r := newTestRouter()
	r.GET("/v1/messages/sent", handlers.GetSent)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/v1/messages/sent?senderId=%d", msg.SenderID), nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
}

func TestGetMessage_ExistingID_ReturnsMessage(t *testing.T) {
	msg := seedMessage(t, 5, 6)
	r := newTestRouter()
	r.GET("/v1/messages/:id", handlers.GetMessage)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/v1/messages/%d", msg.ID), nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
}

func TestGetMessage_NotFound_Returns404(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.GET("/v1/messages/:id", handlers.GetMessage)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/v1/messages/99999", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", w.Code)
	}
}

func TestCreateMessage_ValidPayload_ReturnsMessage(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.POST("/v1/messages/post", handlers.CreateMessage)

	payload := `{"senderId":1,"recipientId":2,"subject":"Hello","body":"World","clientMessageId":"unique-id-1"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/messages/post", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
	var body map[string]any
	json.NewDecoder(w.Body).Decode(&body)
	if body["idempotencyReplayed"] != false {
		t.Errorf("idempotencyReplayed = %v, want false for new message", body["idempotencyReplayed"])
	}
}

func TestCreateMessage_DuplicateClientID_ReturnsIdempotencyReplayed(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.POST("/v1/messages/post", handlers.CreateMessage)

	payload := `{"senderId":1,"recipientId":2,"body":"First","clientMessageId":"idempotent-key-99"}`
	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest(http.MethodPost, "/v1/messages/post", bytes.NewBufferString(payload))
		req.Header.Set("Content-Type", "application/json")
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("request %d: status = %d, want 200", i+1, w.Code)
		}
		if i == 1 {
			var body map[string]any
			json.NewDecoder(w.Body).Decode(&body)
			if body["idempotencyReplayed"] != true {
				t.Errorf("second request: idempotencyReplayed = %v, want true", body["idempotencyReplayed"])
			}
		}
	}
}

func TestReplyToMessage_ValidPayload_CreatesThreadLink(t *testing.T) {
	msg := seedMessage(t, 7, 8)
	r := newTestRouter()
	r.POST("/v1/messages/reply", handlers.ReplyToMessage)

	payload := fmt.Sprintf(
		`{"replyToId":%d,"senderId":8,"recipientId":7,"body":"Reply","clientMessageId":"reply-id-1"}`,
		msg.ID,
	)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/messages/reply", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", w.Code, w.Body.String())
	}
	var body map[string]any
	json.NewDecoder(w.Body).Decode(&body)
	if body["threadId"] == nil {
		t.Error("expected threadId in reply response")
	}
}

func TestReplyToMessage_OriginalNotFound_Returns404(t *testing.T) {
	newTestDB(t)
	r := newTestRouter()
	r.POST("/v1/messages/reply", handlers.ReplyToMessage)

	payload := `{"replyToId":99999,"senderId":1,"recipientId":2,"body":"Reply"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/messages/reply", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", w.Code)
	}
}

func TestGetThread_AfterReply_ReturnsAllMessages(t *testing.T) {
	original := seedMessage(t, 9, 10)
	r := newTestRouter()
	r.POST("/v1/messages/reply", handlers.ReplyToMessage)
	r.GET("/v1/messages/:id/thread", handlers.GetThread)

	replyPayload := fmt.Sprintf(
		`{"replyToId":%d,"senderId":10,"recipientId":9,"body":"Reply","clientMessageId":"thread-reply-1"}`,
		original.ID,
	)
	replyW := httptest.NewRecorder()
	replyReq, _ := http.NewRequest(http.MethodPost, "/v1/messages/reply", bytes.NewBufferString(replyPayload))
	replyReq.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(replyW, replyReq)

	if replyW.Code != http.StatusOK {
		t.Fatalf("reply status = %d, want 200", replyW.Code)
	}

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/v1/messages/%d/thread", original.ID), nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("thread status = %d, want 200", w.Code)
	}
	var body map[string]any
	json.NewDecoder(w.Body).Decode(&body)
	msgs := body["messages"].([]any)
	if len(msgs) < 2 {
		t.Errorf("expected ≥2 messages in thread, got %d", len(msgs))
	}
}

func TestReadMessage_SetsReadAt(t *testing.T) {
	msg := seedMessage(t, 11, 12)
	r := newTestRouter()
	r.POST("/v1/messages/read", handlers.ReadMessage)

	payload := fmt.Sprintf(`{"id":%d}`, msg.ID)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/messages/read", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
}

func TestDeleteMessage_SoftDeletesBySender(t *testing.T) {
	msg := seedMessage(t, 13, 14)
	r := newTestRouter()
	r.POST("/v1/messages/delete", handlers.DeleteMessage)

	payload := fmt.Sprintf(`{"id":%d,"deletedBy":%d}`, msg.ID, msg.SenderID)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/v1/messages/delete", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
}
