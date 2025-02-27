export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RequestOTPPayload {
  email: string;
}

export interface ValidateOTPPayload {
  email: string;
  code: string;
} 