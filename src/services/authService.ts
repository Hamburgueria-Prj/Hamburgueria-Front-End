import { request } from '../lib/api';
import { type AuthLoginRequest, type AuthRegisterRequest, type AuthResponse } from '../types/api';

export async function login(payload: AuthLoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function registrar(payload: AuthRegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
