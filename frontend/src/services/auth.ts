import { api } from './api';
import { User, TokenResponse, LoginRequest, RegisterRequest } from '../types';
import type { AxiosError } from 'axios';

type LoginApiResponse =
  | TokenResponse
  | {
      token: string;
      user?: User;
    };

const normalizeTokenResponse = (data: LoginApiResponse): TokenResponse => {
  if ('access_token' in data) {
    return data;
  }

  return {
    access_token: data.token,
    token_type: 'bearer',
  };
};

const normalizeUserResponse = (raw: Partial<User> & Record<string, unknown>): User => {
  return {
    id: (raw.id as number | string) ?? '',
    email: String(raw.email ?? ''),
    full_name: String(raw.full_name ?? raw.name ?? ''),
    role: String(raw.role ?? 'user') as User['role'],
    membership_status: (raw.membership_status as User['membership_status']) ??
      (raw.membershipStatus as User['membership_status']) ??
      'NON_MEMBER',
    membership_expires_at:
      (raw.membership_expires_at as string | null | undefined) ??
      (raw.membershipExpiresAt as string | null | undefined) ??
      null,
    is_active: (raw.is_active as boolean | undefined) ?? true,
    created_at:
      (raw.created_at as string | undefined) ??
      (raw.createdAt as string | undefined) ??
      new Date().toISOString(),
    name: String(raw.name ?? raw.full_name ?? ''),
  };
};

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const email = data.email ?? data.username;

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', data.password);

    try {
      const response = await api.post<LoginApiResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return normalizeTokenResponse(response.data);
    } catch (error) {
      const status = (error as AxiosError).response?.status;
      const shouldTryJsonFallback = status === 400 || status === 415 || status === 422;

      if (!shouldTryJsonFallback) {
        throw error;
      }

      const response = await api.post<LoginApiResponse>('/auth/login', {
        email,
        password: data.password,
      });
      return normalizeTokenResponse(response.data);
    }
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await api.post<User>('/auth/register', {
      email: data.email,
      password: data.password,
      name: data.full_name,
    });
    return normalizeUserResponse(response.data as unknown as Partial<User> & Record<string, unknown>);
  },

  async getCurrentUser(token?: string): Promise<User> {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    try {
      const response = await api.get<User>('/users/me', { headers });
      return normalizeUserResponse(response.data as unknown as Partial<User> & Record<string, unknown>);
    } catch {
      const response = await api.get<User>('/auth/me', { headers });
      return normalizeUserResponse(response.data as unknown as Partial<User> & Record<string, unknown>);
    }
  },
};
