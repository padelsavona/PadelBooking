import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null });
  },

  initialize: async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const user = await authService.getCurrentUser();
        set({ user, token });
      } catch (error) {
        localStorage.removeItem('access_token');
        set({ user: null, token: null });
      }
    }
  },
}));
