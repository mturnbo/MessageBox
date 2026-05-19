import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(limit = 50, page = 1): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/${limit}/${page}`);
  }

  getUserById(id: number | string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }
}
