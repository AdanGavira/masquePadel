import "server-only";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { COURTS } from "../club";
import { bookableDates, getSlots } from "../slots";
import type { Backend, Block, Booking, Role, User } from "./types";

/**
 * Backend de demostración: guarda todo en un fichero JSON y gestiona la
 * sesión con una cookie firmada. Sirve para probar la web sin Supabase.
 */

interface StoredUser extends User {
  passwordHash: string;
}

interface Db {
  users: StoredUser[];
  bookings: Booking[];
  blocks: Block[];
}

export const DEMO_ACCOUNTS = {
  player: { email: "jugador@masquepadel.test", password: "padel1234" },
  admin: { email: "admin@masquepadel.test", password: "admin1234" },
};

const DB_PATH =
  process.env.DEMO_DB_PATH ??
  (process.env.VERCEL ? "/tmp/masquepadel-demo.json" : path.join(process.cwd(), ".data", "demo-db.json"));

const SESSION_COOKIE = "mp_session";
const SESSION_DAYS = 30;
const SESSION_SECRET = process.env.SESSION_SECRET ?? "masquepadel-demo-secret-cambiar-en-produccion";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

function seed(): Db {
  const user = (name: string, email: string, password: string, role: Role = "player"): StoredUser => ({
    id: randomUUID(),
    name,
    email,
    role,
    passwordHash: hashPassword(password),
  });
  const users = [
    user("Jugador Demo", DEMO_ACCOUNTS.player.email, DEMO_ACCOUNTS.player.password),
    user("Admin masquePadel", DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password, "admin"),
  ];
  const members = ["Lucía Romero", "Javier Ortega", "Marta Gil", "Pablo Núñez", "Carmen Vidal", "Álvaro Ruiz"].map(
    (name, i) => user(name, `socio${i + 1}@masquepadel.test`, randomBytes(12).toString("hex")),
  );
  users.push(...members);

  // Ocupación de ejemplo: más demanda por la tarde que por la mañana.
  let state = 42;
  const random = () => {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    return state / 2 ** 31;
  };
  const bookings: Booking[] = [];
  for (const date of bookableDates()) {
    for (const slot of getSlots()) {
      const hour = Number(slot.slice(0, 2));
      const demand = hour >= 17 ? 0.65 : hour >= 14 ? 0.3 : 0.2;
      for (const court of COURTS) {
        if (random() < demand) {
          bookings.push({
            id: randomUUID(),
            userId: members[Math.floor(random() * members.length)].id,
            courtId: court.id,
            date,
            slot,
            status: "confirmed",
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }
  return { users, bookings, blocks: [] };
}

let queue: Promise<unknown> = Promise.resolve();

/** Serializa los accesos al fichero para que dos reservas no se pisen. */
function withDb<T>(fn: (db: Db) => T | Promise<T>, write = false): Promise<T> {
  const run = queue.then(async () => {
    let db: Db;
    try {
      db = JSON.parse(await readFile(DB_PATH, "utf8"));
    } catch {
      db = seed();
      write = true;
    }
    const result = await fn(db);
    if (write) {
      await mkdir(path.dirname(DB_PATH), { recursive: true });
      const tmp = `${DB_PATH}.tmp`;
      await writeFile(tmp, JSON.stringify(db, null, 2));
      await rename(tmp, DB_PATH);
    }
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function sign(value: string): string {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

async function startSession(userId: string) {
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: expires })).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

async function sessionUserId(): Promise<string | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof uid === "string" && exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

const publicUser = ({ id, email, name, role }: StoredUser): User => ({ id, email, name, role });

export const demoBackend: Backend = {
  mode: "demo",

  async getCurrentUser() {
    const uid = await sessionUserId();
    if (!uid) return null;
    return withDb((db) => {
      const found = db.users.find((u) => u.id === uid);
      return found ? publicUser(found) : null;
    });
  },

  async signIn(email, password) {
    const found = await withDb((db) => db.users.find((u) => u.email === email.toLowerCase()));
    if (!found || !verifyPassword(password, found.passwordHash)) return { ok: false, error: "invalid" };
    await startSession(found.id);
    return { ok: true };
  },

  async signUp(name, email, password) {
    const created = await withDb((db) => {
      if (db.users.some((u) => u.email === email.toLowerCase())) return null;
      const newUser: StoredUser = {
        id: randomUUID(),
        name,
        email: email.toLowerCase(),
        role: "player",
        passwordHash: hashPassword(password),
      };
      db.users.push(newUser);
      return newUser;
    }, true);
    if (!created) return { ok: false, error: "exists" };
    await startSession(created.id);
    return { ok: true };
  },

  async signOut() {
    (await cookies()).delete(SESSION_COOKIE);
  },

  async getOccupied(date, viewerId) {
    return withDb((db) => [
      ...db.bookings
        .filter((b) => b.date === date && b.status === "confirmed")
        .map((b) => ({ courtId: b.courtId, slot: b.slot, kind: "booked" as const, mine: b.userId === viewerId })),
      ...db.blocks
        .filter((b) => b.date === date)
        .map((b) => ({ courtId: b.courtId, slot: b.slot, kind: "blocked" as const, mine: false })),
    ]);
  },

  async insertBooking({ userId, courtId, date, slot }) {
    return withDb((db) => {
      const busy =
        db.bookings.some((b) => b.status === "confirmed" && b.courtId === courtId && b.date === date && b.slot === slot) ||
        db.blocks.some((b) => b.courtId === courtId && b.date === date && b.slot === slot);
      if (busy) return { ok: false as const, error: "taken" as const };
      const booking: Booking = {
        id: randomUUID(),
        userId,
        courtId,
        date,
        slot,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };
      db.bookings.push(booking);
      return { ok: true as const, booking };
    }, true);
  },

  async getBooking(id) {
    return withDb((db) => db.bookings.find((b) => b.id === id) ?? null);
  },

  async markCancelled(id) {
    await withDb((db) => {
      const booking = db.bookings.find((b) => b.id === id);
      if (booking) booking.status = "cancelled";
    }, true);
  },

  async listUserBookings(userId) {
    return withDb((db) => db.bookings.filter((b) => b.userId === userId));
  },

  async listDayBookings(date) {
    return withDb((db) =>
      db.bookings
        .filter((b) => b.date === date && b.status === "confirmed")
        .map((b) => {
          const owner = db.users.find((u) => u.id === b.userId);
          return { ...b, userName: owner?.name, userEmail: owner?.email };
        }),
    );
  },

  async listBlocks(date) {
    return withDb((db) => db.blocks.filter((b) => b.date === date));
  },

  async setBlocked(block, blocked) {
    await withDb((db) => {
      const same = (b: Block) => b.courtId === block.courtId && b.date === block.date && b.slot === block.slot;
      db.blocks = db.blocks.filter((b) => !same(b));
      if (blocked) db.blocks.push(block);
    }, true);
  },
};
