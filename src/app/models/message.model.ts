export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  subject?: string;
  body?: string;
  sentAt: string;
  senderAddress?: string;
  readAt?: string;
  readerAddress?: string;
  deletedBySender?: string;
  deletedByRecipient?: string;
  // enriched fields (populated by frontend)
  senderName?: string;
  recipientName?: string;
}

export interface CreateMessageRequest {
  senderId: number;
  recipientId: number;
  subject?: string;
  body?: string;
  senderAddress?: string;
}

export interface ReadMessageRequest {
  id: number;
  readerAddress?: string;
}

export interface DeleteMessageRequest {
  id: number;
  deletedBy: number;
}

export interface InboxPage {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

/** Same shape as InboxPage — reused for the sent-messages endpoint. */
export type SentPage = InboxPage;
