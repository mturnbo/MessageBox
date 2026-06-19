export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  deviceAddress?: string;
  dateCreated?: string;
  lastLogin?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  token: string;
  refreshToken?: string;
}

export interface AuthUser {
  username: string;
  token: string;
  refreshToken?: string;
  userId?: number;
}
