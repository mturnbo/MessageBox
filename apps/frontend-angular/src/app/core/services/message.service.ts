import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateMessageRequest,
  DeleteMessageRequest,
  InboxPage,
  Message,
  ReadMessageRequest,
  SentPage,
} from '../../models/message.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private baseUrl = `${environment.apiUrl}/v1/messages`;

  constructor(private http: HttpClient) {}

  /** Fetch inbox messages for the current user. */
  getInbox(recipientId: number, page = 1, limit = 10): Observable<InboxPage> {
    const params = new HttpParams()
      .set('recipientId', recipientId)
      .set('page', page)
      .set('limit', limit);
    return this.http.get<InboxPage>(`${this.baseUrl}/inbox`, { params });
  }

  /** Fetch sent messages for the current user. */
  getSent(senderId: number, page = 1, limit = 10): Observable<SentPage> {
    const params = new HttpParams()
      .set('senderId', senderId)
      .set('page', page)
      .set('limit', limit);
    return this.http.get<SentPage>(`${this.baseUrl}/sent`, { params });
  }

  getMessageById(id: number): Observable<Message> {
    return this.http.get<Message>(`${this.baseUrl}/${id}`);
  }

  createMessage(payload: CreateMessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/post`, payload);
  }

  markAsRead(payload: ReadMessageRequest): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/read`, payload);
  }

  /**
   * Archive / soft-delete a message.
   * Pass the current user's ID as deletedBy so the API sets the correct field.
   */
  archiveMessage(payload: DeleteMessageRequest): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/delete`, payload);
  }
}
