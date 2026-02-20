export type UserRole = 'user' | 'admin' | 'manager' | 'USER' | 'ADMIN' | 'MANAGER';
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  name?: string; // compat con Navbar
}

export interface Court {
  id: number | string;
  name: string;
  description?: string;
  is_active: boolean;
  hourly_rate: number;
  price_per_hour?: number;
  pricePerHour?: number; // compat con BookingForm
  created_at: string;
}

export interface CourtAvailability {
  court_id: number | string;
  date: string;
  occupied_hours: string[];
  free_hours: string[];
}

export interface Booking {
  id: number | string;
  court_id?: number | string;
  courtId?: number | string;

  // già presenti
  start_time: string;
  end_time: string;
  total_price: number;
  status: BookingStatus;

  // compat frontend
  startTime?: string;
  endTime?: string;
  totalPrice?: number;
  court?: Court;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };

  // campi usati nelle pagine
  is_blocked?: boolean;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | string;
  notes?: string;
}

export interface LoginRequest {
  email?: string;
  username?: string;
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
  court_id: number | string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface AdminBlockRequest {
  court_id: number | string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface CheckoutRequest {
  booking_id: number;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  token?: string; // compat con codice legacy
}
