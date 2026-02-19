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
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(token?: string): Promise<User> {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    try {
      const response = await api.get<User>('/users/me', { headers });
      return response.data;
    } catch {
      const response = await api.get<User>('/auth/me', { headers });
      return response.data;
    }
  },
};
