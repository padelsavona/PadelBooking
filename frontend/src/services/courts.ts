import { api } from './api';
import { Court } from '../types';

export const courtService = {
  async getCourts(activeOnly = true): Promise<Court[]> {
    const response = await api.get<Court[]>('/courts', {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  async getCourt(id: number): Promise<Court> {
    const response = await api.get<Court>(`/courts/${id}`);
    return response.data;
  },
};
