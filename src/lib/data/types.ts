import type { Level } from "../academy";
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

export type Experience = "never" | "beginner" | "intermediate" | "advanced";
export type PreferredTime = "morning" | "afternoon" | "evening";
export type AcademyStatus = "pending" | "assigned" | "waitlist" | "cancelled";

/** Solicitud de inscripción en la academia. */
export interface AcademyRequest {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  forWhom: "adult" | "child";
  childAge: number | null;
  experience: Experience;
  /** Días preferidos: 0 = domingo … 6 = sábado. */
  preferredDays: number[];
  preferredTime: PreferredTime | null;
  /** Prueba de nivel elegida, o null si prefiere que le llamen. */
  testDate: DateKey | null;
  testSlot: string | null;
  notes: string;
  status: AcademyStatus;
  assessedLevel: Level | null;
  groupId: string | null;
  createdAt: string;
}

export type NewAcademyRequest = Omit<AcademyRequest, "id" | "status" | "assessedLevel" | "groupId" | "createdAt">;

export type AcademyUpdate = Pick<AcademyRequest, "status" | "assessedLevel" | "groupId">;

export type AuthError = "invalid" | "exists" | "weak" | "unconfirmed" | "unknown";

/** `needsConfirmation`: cuenta creada, pero hay que confirmar el email antes de entrar. */
export type AuthResult = { ok: true; needsConfirmation?: boolean } | { ok: false; error: AuthError };

export type CreateBookingResult = { ok: true; booking: Booking } | { ok: false; error: "taken" };

/**
 * Almacenamiento de datos. Hay dos implementaciones: una de demostración
 * (cookie firmada en el navegador, sin configuración) y otra con Supabase.
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

  insertAcademyRequest(request: NewAcademyRequest): Promise<void>;
  /** Inscritos en cada prueba de nivel (solicitudes no canceladas). */
  levelTestCounts(): Promise<{ date: DateKey; slot: string; count: number }[]>;
  /** Alumnos asignados a cada grupo. */
  groupMemberCounts(): Promise<Record<string, number>>;
  listAcademyRequests(): Promise<AcademyRequest[]>;
  listUserAcademyRequests(userId: string): Promise<AcademyRequest[]>;
  getAcademyRequest(id: string): Promise<AcademyRequest | null>;
  updateAcademyRequest(id: string, update: AcademyUpdate): Promise<void>;
}
