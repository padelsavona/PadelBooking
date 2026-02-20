import { api } from './api';

export type MembershipStatus = 'MEMBER' | 'NON_MEMBER';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  membershipStatus: MembershipStatus;
  membershipExpiresAt?: string | null;
  createdAt: string;
}

export const userService = {
  async listUsers(): Promise<AdminUser[]> {
    const response = await api.get<AdminUser[]>('/users');
    return response.data;
  },

  async updateMembership(payload: {
    email: string;
    membershipStatus: MembershipStatus;
    membershipExpiresAt?: string | null;
  }): Promise<AdminUser> {
    const response = await api.patch<AdminUser>('/users/membership', payload);
    return response.data;
  },
};
