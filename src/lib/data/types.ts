import type { DateKey } from "../time";

export type Role = "player" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Booking {
  id: string;
  userId: string;
  courtId: number;
  date: DateKey;
  slot: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
  /** Solo se rellenan en las consultas de administración. */
  userName?: string;
  userEmail?: string;
}

export interface Block {
  courtId: number;
  date: DateKey;
  slot: string;
}

/** Estado de un hueco ocupado tal y como lo ve un jugador. */
export interface Occupied {
  courtId: number;
  slot: string;
  kind: "booked" | "blocked";
  mine: boolean;
}

export type AuthResult = { ok: true } | { ok: false; error: "invalid" | "exists" | "weak" | "unknown" };

export type CreateBookingResult = { ok: true; booking: Booking } | { ok: false; error: "taken" };

/**
 * Almacenamiento de datos. Hay dos implementaciones: una de demostración
 * (fichero JSON local, sin configuración) y otra con Supabase.
 * Las reglas de negocio están en `bookings.ts`, no aquí.
 */
export interface Backend {
  mode: "demo" | "supabase";

  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(name: string, email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;

  getOccupied(date: DateKey, viewerId: string | null): Promise<Occupied[]>;
  insertBooking(input: { userId: string; courtId: number; date: DateKey; slot: string }): Promise<CreateBookingResult>;
  getBooking(id: string): Promise<Booking | null>;
  markCancelled(id: string): Promise<void>;
  listUserBookings(userId: string): Promise<Booking[]>;

  listDayBookings(date: DateKey): Promise<Booking[]>;
  listBlocks(date: DateKey): Promise<Block[]>;
  setBlocked(block: Block, blocked: boolean): Promise<void>;
}
