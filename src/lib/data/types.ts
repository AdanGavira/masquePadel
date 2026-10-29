import type { Level } from "../academy";
import type { CartLine, Order, OrderStatus, Product } from "../shop";
import type { Category, MatchResult, Pair, Tournament } from "../tournaments";
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

/** Inscripción completa, con emails: solo para el propio jugador y el administrador. */
export interface Registration extends Pair {
  userId: string;
  player1Email: string;
  player2Email: string;
  status: "confirmed" | "cancelled";
}

export type NewTournament = Omit<Tournament, "id" | "bracketGenerated">;

export interface NewRegistration {
  tournamentId: string;
  category: Category;
  userId: string;
  player1Name: string;
  player1Email: string;
  player2Name: string;
  player2Email: string;
}

export type ProductInput = Omit<Product, "id">;

export type PlaceOrderResult =
  | { ok: true; order: Order }
  | { ok: false; error: "empty" | "invalid" | "stock"; productId?: string };

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

  listTournaments(): Promise<Tournament[]>;
  getTournament(id: string): Promise<Tournament | null>;
  createTournament(tournament: NewTournament): Promise<Tournament>;
  /** Parejas confirmadas, sin emails (público). */
  listPairs(tournamentId?: string): Promise<Pair[]>;
  /** Inscripciones donde el usuario es jugador 1 o su email es el del compañero. */
  listUserRegistrations(userId: string, email: string): Promise<Registration[]>;
  listTournamentRegistrations(tournamentId: string): Promise<Registration[]>;
  getRegistration(id: string): Promise<Registration | null>;
  /** Comprueba cupo y que ningún jugador esté ya inscrito en la categoría. */
  insertRegistration(registration: NewRegistration): Promise<{ ok: true } | { ok: false; error: "duplicate" | "full" }>;
  cancelRegistration(id: string): Promise<void>;
  /** Guarda las cabezas de serie y cierra las inscripciones. */
  generateBracket(tournamentId: string, seeds: { id: string; seed: number }[]): Promise<void>;
  listResults(tournamentId?: string): Promise<MatchResult[]>;
  setResult(result: MatchResult): Promise<void>;

  /** Todo el catálogo, también los productos desactivados. */
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  saveProduct(input: ProductInput, id?: string): Promise<Product>;
  /** Comprueba stock y precios, descuenta el stock y crea el pedido de una vez. */
  placeOrder(user: User, lines: CartLine[]): Promise<PlaceOrderResult>;
  listUserOrders(userId: string): Promise<Order[]>;
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  /** Al cancelar se devuelve el stock. */
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
}
