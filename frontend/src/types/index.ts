export interface User {
  id: string;
  email: string;
  name: string;
  role: 'PLAYER' | 'ADMIN';
}

export interface Court {
  id: string;
  name: string;
  description?: string;
  pricePerHour: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  courtId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'BLOCKED';
  totalPrice: number;
  notes?: string;
  court?: Court;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}
