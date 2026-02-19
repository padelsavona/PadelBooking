export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'manager';
  is_active: boolean;
  created_at: string;
}

export interface Court {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  hourly_rate: number;
  created_at: string;
}

export interface Booking {
  id: number;
  user_id: number;
  court_id: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  notes?: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface BookingCreate {
  court_id: number;
  start_time: string;
  end_time: string;
  notes?: string;
}
