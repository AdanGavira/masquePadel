import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isAcademyCell, upcomingLevelTests } from "../academy";
import { COURTS } from "../club";
import { getSlots } from "../slots";
import { todayKey, type DateKey } from "../time";
import type { AcademyRequest, AcademyUpdate, Backend, Block, Booking, Role, User } from "./types";

/**
 * Backend de demostración sin servidor de datos: cada visitante tiene su
 * propio "club" guardado en una cookie firmada. Así funciona igual en local
 * que en Vercel, donde cada petición puede ir a una instancia distinta.
 *
 * - Las cuentas de prueba tienen identificadores fijos.
 * - La ocupación de los socios ficticios se calcula a partir de la fecha,
 *   siempre igual, sin guardarse en ningún sitio.
 * - Lo que hace el visitante (registro, reservas, bloqueos) va en la cookie.
 */

interface StoredUser extends User {
  passwordHash: string;
}

/** Reserva compacta: [id, userId, pista, fecha, turno, cancelada]. */
type BookingTuple = [string, string, number, DateKey, string, 0 | 1];

interface DemoState {
  users: StoredUser[];
  bookings: BookingTuple[];
  blocks: [number, DateKey, string][];
  /** Reservas de socios anuladas por el administrador. */
  cancelledSeeds: string[];
  /** Solicitudes de academia enviadas desde este navegador. */
  academy: AcademyRequest[];
  /** Cambios del administrador sobre las solicitudes de ejemplo. */
  academyOverrides: Record<string, AcademyUpdate>;
}

export const DEMO_ACCOUNTS = {
  player: { email: "jugador@masquepadel.test", password: "padel1234" },
  admin: { email: "admin@masquepadel.test", password: "admin1234" },
};

const FIXED_USERS: (User & { password: string })[] = [
  { id: "demo-player", name: "Jugador Demo", role: "player", ...DEMO_ACCOUNTS.player },
  { id: "demo-admin", name: "Admin masquePadel", role: "admin", ...DEMO_ACCOUNTS.admin },
];

const MEMBERS = ["Lucía Romero", "Javier Ortega", "Marta Gil", "Pablo Núñez", "Carmen Vidal", "Álvaro Ruiz"].map(
  (name, i) => ({ id: `member-${i + 1}`, name, email: `socio${i + 1}@masquepadel.test`, role: "player" as Role }),
);

const SESSION_COOKIE = "mp_session";
const STATE_COOKIE = "mp_demo";
const COOKIE_DAYS = 30;
const MAX_BOOKINGS = 20;
const MAX_BLOCKS = 40;
const MAX_USERS = 3;
const MAX_ACADEMY = 2;
const SECRET = process.env.SESSION_SECRET ?? "masquepadel-demo-secret-cambiar-en-produccion";

// --- Ocupación ficticia de los socios ------------------------------------------

/** Número pseudoaleatorio estable en [0, 1) para un texto dado. */
function stableRandom(key: string): number {
  return createHmac("sha256", "masquepadel-seed").update(key).digest().readUInt32BE(0) / 2 ** 32;
}

function seededBookings(date: DateKey): Booking[] {
  const result: Booking[] = [];
  for (const slot of getSlots()) {
    const hour = Number(slot.slice(0, 2));
    // Más demanda por la tarde que por la mañana.
    const demand = hour >= 17 ? 0.65 : hour >= 14 ? 0.3 : 0.2;
    for (const { id: courtId } of COURTS) {
      if (isAcademyCell(date, courtId, slot)) continue;
      const key = `${date}|${courtId}|${slot}`;
      if (stableRandom(key) < demand) {
        const member = MEMBERS[Math.floor(stableRandom(`${key}|who`) * MEMBERS.length)];
        result.push({
          id: `seed_${date}_${courtId}_${slot.replace(":", "")}`,
          userId: member.id,
          courtId,
          date,
          slot,
          status: "confirmed",
          createdAt: `${date}T00:00:00.000Z`,
        });
      }
    }
  }
  return result;
}

function parseSeedId(id: string): Booking | null {
  const match = /^seed_(\d{4}-\d{2}-\d{2})_(\d)_(\d{2})(\d{2})$/.exec(id);
  if (!match) return null;
  return seededBookings(match[1]).find((b) => b.id === id) ?? null;
}

// --- Academia de ejemplo -----------------------------------------------------------

/** Alumnos ya asignados a cada grupo antes de abrir la demo. */
const SEED_GROUP_MEMBERS: Record<string, number> = {
  "ini-lx": 3,
  "ini-mj": 2,
  "ini-s": 1,
  "int-lx": 4,
  "av-mj": 2,
  "inf-v": 4,
};

function seededRequests(): AcademyRequest[] {
  const tests = upcomingLevelTests();
  const base = {
    userId: null,
    childAge: null,
    notes: "",
    status: "pending" as const,
    assessedLevel: null,
    groupId: null,
    createdAt: `${todayKey()}T09:00:00.000Z`,
  };
  return [
    {
      ...base,
      id: "seedreq-1",
      name: "Rocío Benítez",
      email: "rocio@ejemplo.test",
      phone: "600 111 222",
      forWhom: "adult",
      experience: "never",
      preferredDays: [1, 3],
      preferredTime: "afternoon",
      testDate: tests[0]?.date ?? null,
      testSlot: tests[0]?.slot ?? null,
      notes: "Nunca he jugado, quiero empezar con amigas.",
    },
    {
      ...base,
      id: "seedreq-2",
      name: "Daniel Herrera",
      email: "daniel@ejemplo.test",
      phone: "600 333 444",
      forWhom: "adult",
      experience: "intermediate",
      preferredDays: [1, 3],
      preferredTime: "evening",
      testDate: tests[0]?.date ?? null,
      testSlot: tests[0]?.slot ?? null,
    },
    {
      ...base,
      id: "seedreq-3",
      name: "Hugo Morales",
      email: "familia.morales@ejemplo.test",
      phone: "600 555 666",
      forWhom: "child",
      childAge: 10,
      experience: "beginner",
      preferredDays: [5],
      preferredTime: "afternoon",
      testDate: tests[1]?.date ?? null,
      testSlot: tests[1]?.slot ?? null,
    },
    {
      ...base,
      id: "seedreq-4",
      name: "Inés Castro",
      email: "ines@ejemplo.test",
      phone: "600 777 888",
      forWhom: "adult",
      experience: "advanced",
      preferredDays: [2, 4],
      preferredTime: "evening",
      testDate: null,
      testSlot: null,
      notes: "Prefiero que me llaméis por la tarde.",
    },
  ];
}

function allRequests(state: DemoState): AcademyRequest[] {
  return [
    ...seededRequests().map((r) => ({ ...r, ...state.academyOverrides[r.id] })),
    ...state.academy,
  ];
}

// --- Cookies firmadas -------------------------------------------------------------

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

function encode(data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_DAYS * 86400,
});

async function readState(): Promise<DemoState> {
  const state = decode<Partial<DemoState>>((await cookies()).get(STATE_COOKIE)?.value) ?? {};
  return {
    users: state.users ?? [],
    bookings: state.bookings ?? [],
    blocks: state.blocks ?? [],
    cancelledSeeds: state.cancelledSeeds ?? [],
    academy: state.academy ?? [],
    academyOverrides: state.academyOverrides ?? {},
  };
}

/** Solo se puede llamar desde acciones de servidor (es cuando se escriben cookies). */
async function writeState(state: DemoState) {
  // Se conservan las reservas más recientes para no superar el tamaño máximo de una cookie.
  state.bookings = state.bookings.slice(-MAX_BOOKINGS);
  state.blocks = state.blocks.slice(-MAX_BLOCKS);
  state.users = state.users.slice(-MAX_USERS);
  state.cancelledSeeds = state.cancelledSeeds.slice(-MAX_BOOKINGS);
  state.academy = state.academy.slice(-MAX_ACADEMY);
  (await cookies()).set(STATE_COOKIE, encode(state), cookieOptions());
}

async function startSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, encode({ uid: userId, exp: Date.now() + COOKIE_DAYS * 86400_000 }), cookieOptions());
}

async function sessionUserId(): Promise<string | null> {
  const session = decode<{ uid: string; exp: number }>((await cookies()).get(SESSION_COOKIE)?.value);
  return session && session.exp > Date.now() ? session.uid : null;
}

// --- Usuarios ---------------------------------------------------------------------

function hashPassword(password: string): string {
  const salt = randomBytes(8).toString("hex");
  return `${salt}:${scryptSync(password, salt, 16).toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  return timingSafeEqual(expected, scryptSync(password, salt, expected.length));
}

function findUser(state: DemoState, id: string): User | null {
  const found =
    FIXED_USERS.find((u) => u.id === id) ?? state.users.find((u) => u.id === id) ?? MEMBERS.find((u) => u.id === id);
  return found ? { id: found.id, email: found.email, name: found.name, role: found.role } : null;
}

// --- Reservas ---------------------------------------------------------------------

const fromTuple = ([id, userId, courtId, date, slot, cancelled]: BookingTuple): Booking => ({
  id,
  userId,
  courtId,
  date,
  slot,
  status: cancelled ? "cancelled" : "confirmed",
  createdAt: "",
});

function confirmedOn(state: DemoState, date: DateKey): Booking[] {
  return [
    ...seededBookings(date).filter((b) => !state.cancelledSeeds.includes(b.id)),
    ...state.bookings.map(fromTuple).filter((b) => b.date === date && b.status === "confirmed"),
  ];
}

const sameSlot = (a: { courtId: number; slot: string }, b: { courtId: number; slot: string }) =>
  a.courtId === b.courtId && a.slot === b.slot;

export const demoBackend: Backend = {
  mode: "demo",

  async getCurrentUser() {
    const uid = await sessionUserId();
    return uid ? findUser(await readState(), uid) : null;
  },

  async signIn(email, password) {
    const normalized = email.toLowerCase();
    const fixed = FIXED_USERS.find((u) => u.email === normalized);
    if (fixed) {
      if (fixed.password !== password) return { ok: false, error: "invalid" };
      await startSession(fixed.id);
      return { ok: true };
    }
    const stored = (await readState()).users.find((u) => u.email === normalized);
    if (!stored || !verifyPassword(password, stored.passwordHash)) return { ok: false, error: "invalid" };
    await startSession(stored.id);
    return { ok: true };
  },

  async signUp(name, email, password) {
    const normalized = email.toLowerCase();
    const state = await readState();
    const taken = [...FIXED_USERS, ...MEMBERS, ...state.users].some((u) => u.email === normalized);
    if (taken) return { ok: false, error: "exists" };
    const user: StoredUser = {
      id: `user-${randomBytes(6).toString("hex")}`,
      name,
      email: normalized,
      role: "player",
      passwordHash: hashPassword(password),
    };
    state.users.push(user);
    await writeState(state);
    await startSession(user.id);
    return { ok: true };
  },

  async signOut() {
    (await cookies()).delete(SESSION_COOKIE);
  },

  async getOccupied(date, viewerId) {
    const state = await readState();
    return [
      ...confirmedOn(state, date).map((b) => ({
        courtId: b.courtId,
        slot: b.slot,
        kind: "booked" as const,
        mine: b.userId === viewerId,
      })),
      ...state.blocks
        .filter(([, d]) => d === date)
        .map(([courtId, , slot]) => ({ courtId, slot, kind: "blocked" as const, mine: false })),
    ];
  },

  async insertBooking({ userId, courtId, date, slot }) {
    const state = await readState();
    const busy =
      confirmedOn(state, date).some((b) => sameSlot(b, { courtId, slot })) ||
      state.blocks.some(([c, d, s]) => c === courtId && d === date && s === slot);
    if (busy) return { ok: false, error: "taken" };
    const tuple: BookingTuple = [randomBytes(6).toString("hex"), userId, courtId, date, slot, 0];
    state.bookings.push(tuple);
    await writeState(state);
    return { ok: true, booking: fromTuple(tuple) };
  },

  async getBooking(id) {
    const state = await readState();
    const own = state.bookings.find(([bookingId]) => bookingId === id);
    if (own) return fromTuple(own);
    const seed = parseSeedId(id);
    if (!seed) return null;
    return state.cancelledSeeds.includes(id) ? { ...seed, status: "cancelled" } : seed;
  },

  async markCancelled(id) {
    const state = await readState();
    const own = state.bookings.find(([bookingId]) => bookingId === id);
    if (own) own[5] = 1;
    else if (parseSeedId(id)) state.cancelledSeeds.push(id);
    await writeState(state);
  },

  async listUserBookings(userId) {
    return (await readState()).bookings.map(fromTuple).filter((b) => b.userId === userId);
  },

  async listDayBookings(date) {
    const state = await readState();
    return confirmedOn(state, date).map((b) => {
      const owner = findUser(state, b.userId);
      return { ...b, userName: owner?.name, userEmail: owner?.email };
    });
  },

  async listBlocks(date) {
    return (await readState()).blocks
      .filter(([, d]) => d === date)
      .map(([courtId, d, slot]): Block => ({ courtId, date: d, slot }));
  },

  async setBlocked({ courtId, date, slot }, blocked) {
    const state = await readState();
    state.blocks = state.blocks.filter(([c, d, s]) => !(c === courtId && d === date && s === slot));
    if (blocked) state.blocks.push([courtId, date, slot]);
    await writeState(state);
  },

  async insertAcademyRequest(request) {
    const state = await readState();
    state.academy.push({
      ...request,
      id: `req-${randomBytes(6).toString("hex")}`,
      status: "pending",
      assessedLevel: null,
      groupId: null,
      createdAt: new Date().toISOString(),
    });
    await writeState(state);
  },

  async levelTestCounts() {
    const counts = new Map<string, { date: DateKey; slot: string; count: number }>();
    for (const r of allRequests(await readState())) {
      if (!r.testDate || !r.testSlot || r.status === "cancelled") continue;
      const key = `${r.testDate} ${r.testSlot}`;
      const entry = counts.get(key) ?? { date: r.testDate, slot: r.testSlot, count: 0 };
      entry.count++;
      counts.set(key, entry);
    }
    return [...counts.values()];
  },

  async groupMemberCounts() {
    const counts = { ...SEED_GROUP_MEMBERS };
    for (const r of allRequests(await readState())) {
      if (r.status === "assigned" && r.groupId) counts[r.groupId] = (counts[r.groupId] ?? 0) + 1;
    }
    return counts;
  },

  async listAcademyRequests() {
    return allRequests(await readState());
  },

  async listUserAcademyRequests(userId) {
    return (await readState()).academy.filter((r) => r.userId === userId);
  },

  async getAcademyRequest(id) {
    return allRequests(await readState()).find((r) => r.id === id) ?? null;
  },

  async updateAcademyRequest(id, update) {
    const state = await readState();
    const own = state.academy.find((r) => r.id === id);
    if (own) Object.assign(own, update);
    else if (seededRequests().some((r) => r.id === id)) state.academyOverrides[id] = update;
    await writeState(state);
  },
};
