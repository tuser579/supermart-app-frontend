import { post } from '../../../shared/api/apiClient';
import { AuthResponse, LoginPayload, RegisterPayload, OTPPayload } from '../../../shared/types/auth.types';

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/login', payload as unknown as Record<string, unknown>);
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/register', payload as unknown as Record<string, unknown>);
}

export async function verifyOTP(payload: OTPPayload): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/verify-otp', payload as unknown as Record<string, unknown>);
}

export async function resendOTP(email: string): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/resend-otp', { email });
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/refresh-token', { refreshToken: token });
}

export async function logout(): Promise<{ message: string }> {
  return post<{ message: string }>('/auth/logout');
}
