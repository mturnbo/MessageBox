package models

import "time"

type User struct {
	ID            uint       `gorm:"primaryKey;autoIncrement"           json:"id"`
	Username      string     `gorm:"uniqueIndex;not null"               json:"username"`
	Email         string     `gorm:"uniqueIndex;not null"               json:"email"`
	PasswordHash  string     `gorm:"column:password_hash;not null"     json:"-"`
	FirstName     string     `gorm:"column:first_name;not null"        json:"firstName"`
	LastName      string     `gorm:"column:last_name;not null"         json:"lastName"`
	DeviceAddress *string    `gorm:"column:device_address"             json:"deviceAddress"`
	DateCreated   time.Time  `gorm:"column:date_created;autoCreateTime" json:"dateCreated"`
	LastLogin     *time.Time `gorm:"column:last_login"                 json:"lastLogin"`
}

func (User) TableName() string { return "users" }

type Message struct {
	ID                 uint       `gorm:"primaryKey;autoIncrement"                  json:"id"`
	SenderID           uint       `gorm:"column:sender_id;index;not null"           json:"senderId"`
	RecipientID        uint       `gorm:"column:recipient_id;index;not null"        json:"recipientId"`
	Subject            *string    `                                                 json:"subject"`
	Body               *string    `                                                 json:"body"`
	SentAt             time.Time  `gorm:"column:sent_at;autoCreateTime"             json:"sentAt"`
	SenderAddress      *string    `gorm:"column:sender_address"                     json:"senderAddress"`
	ClientMessageID    *string    `gorm:"column:client_message_id;uniqueIndex"      json:"clientMessageId"`
	ReadAt             *time.Time `gorm:"column:read_at"                            json:"readAt"`
	ReaderAddress      *string    `gorm:"column:reader_address"                     json:"readerAddress"`
	DeletedBySender    *time.Time `gorm:"column:deleted_by_sender"                  json:"deletedBySender"`
	DeletedByRecipient *time.Time `gorm:"column:deleted_by_recipient"               json:"deletedByRecipient"`
}

func (Message) TableName() string { return "messages" }

type Thread struct {
	ID          uint      `gorm:"primaryKey;autoIncrement"                json:"id"`
	OriginMsg   uint      `gorm:"column:origin_msg;uniqueIndex;not null"  json:"originMsg"`
	DateCreated time.Time `gorm:"column:date_created;autoCreateTime"      json:"dateCreated"`
}

func (Thread) TableName() string { return "threads" }

type ThreadMessage struct {
	ThreadID uint `gorm:"column:thread_id;primaryKey" json:"threadId"`
	MsgID    uint `gorm:"column:msg_id;primaryKey"    json:"msgId"`
	ReplyTo  uint `gorm:"column:reply_to;primaryKey"  json:"replyTo"`
}

func (ThreadMessage) TableName() string { return "thread_messages" }
