import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { addDays, todayKey, type DateKey } from "../time";
import {
  CATEGORIES,
  assignSeeds,
  computeRanking,
  seedOrder,
  weekdayOf,
  type Category,
  type MatchResult,
  type Pair,
  type Tournament,
} from "../tournaments";
import { cookieOptions, decode, encode, stableRandom } from "./demo-cookies";
import type { Backend, Registration } from "./types";

/**
 * Torneos del modo demostración. Hay dos torneos ya jugados (para que exista
 * ranking) y uno abierto; lo que hace el visitante va en su propia cookie.
 */

const COOKIE = "mp_demo_t";
const MAX_CREATED = 2;
const MAX_REGISTRATIONS = 4;
const MAX_RESULTS = 60;

type ResultTuple = [number, number, number, 0 | 1, string];

interface TournamentState {
  /** Torneos creados por el administrador. */
  t: Tournament[];
  /** Inscripciones del visitante. */
  r: Registration[];
  /** Inscripciones canceladas. */
  c: string[];
  /** Torneos de ejemplo con el cuadro ya generado. */
  g: string[];
  /** Resultados por torneo: [categoría, ronda, posición, ganador, marcador]. */
  res: Record<string, ResultTuple[]>;
}

async function readState(): Promise<TournamentState> {
  const s = decode<Partial<TournamentState>>((await cookies()).get(COOKIE)?.value) ?? {};
  return { t: s.t ?? [], r: s.r ?? [], c: s.c ?? [], g: s.g ?? [], res: s.res ?? {} };
}

async function writeState(s: TournamentState) {
  s.t = s.t.slice(-MAX_CREATED);
  s.r = s.r.slice(-MAX_REGISTRATIONS);
  s.c = s.c.slice(-10);
  for (const id of Object.keys(s.res)) s.res[id] = s.res[id].slice(-MAX_RESULTS);
  (await cookies()).set(COOKIE, encode(s), cookieOptions());
}

export const playerKey = (email: string) => createHash("md5").update(email.trim().toLowerCase()).digest("hex");

// --- Datos de ejemplo -----------------------------------------------------------------

const MEN = [
  "Carlos Ruiz", "Manuel Vega", "Alejandro Sanz", "David Moreno", "Antonio Ríos", "Fran Delgado", "Jorge Navarro",
  "Rafa Domínguez", "Sergio Prieto", "Miguel Ortiz", "Luis Cabrera", "Pedro Marín", "Iván Romero", "Rubén Gil",
  "Adrián León", "Óscar Fuentes",
];
const WOMEN = [
  "Lucía Ramos", "Marta Serrano", "Paula Molina", "Elena Castillo", "Laura Iglesias", "Sara Medina", "Cristina Lozano",
  "Ana Garrido", "Nuria Peña", "Irene Vidal", "Clara Santos", "Patricia Muñoz", "Andrea Cano", "Beatriz Rubio",
  "Rocío Herrera", "Silvia Pastor",
];

const emailOf = (name: string) =>
  `${name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, ".")}@jugadores.test`;

function seedPairs(category: Category): [string, string][] {
  if (category === "masculino") return Array.from({ length: 8 }, (_, i) => [MEN[i * 2], MEN[i * 2 + 1]]);
  if (category === "femenino") return Array.from({ length: 8 }, (_, i) => [WOMEN[i * 2], WOMEN[i * 2 + 1]]);
  return Array.from({ length: 8 }, (_, i) => [MEN[(i * 2 + 1) % 16], WOMEN[(i * 2 + 3) % 16]]);
}

/** Sábado anterior o igual a la fecha dada. */
function saturdayOnOrBefore(date: DateKey): DateKey {
  return addDays(date, -((weekdayOf(date) + 1) % 7));
}

function seededTournaments(): Tournament[] {
  const today = todayKey();
  const autumn = saturdayOnOrBefore(addDays(today, -10));
  const summer = addDays(autumn, -42);
  const open = saturdayOnOrBefore(addDays(today, 21));
  const base = { startSlot: "09:30", endSlot: "20:00", categories: CATEGORIES, maxPairs: 16, pricePerPair: 30 };
  return [
    { ...base, id: "t-verano", name: "Torneo de Verano", date: summer, registrationCloses: addDays(summer, -3), bracketGenerated: true },
    { ...base, id: "t-otono", name: "Torneo de Otoño", date: autumn, registrationCloses: addDays(autumn, -3), bracketGenerated: true },
    { ...base, id: "t-invierno", name: "Open de Invierno", date: open, registrationCloses: addDays(open, -3), bracketGenerated: false },
  ];
}

function makeRegistration(t: Tournament, category: Category, i: number, [p1, p2]: [string, string]): Registration {
  const createdAt = `${addDays(t.registrationCloses, -10)}T10:${String(i).padStart(2, "0")}:00.000Z`;
  return {
    id: `s-${t.id}-${category[0]}-${i}`,
    tournamentId: t.id,
    category,
    userId: `seed-${category}-${i}`,
    player1Name: p1,
    player2Name: p2,
    player1Email: emailOf(p1),
    player2Email: emailOf(p2),
    player1Key: playerKey(emailOf(p1)),
    player2Key: playerKey(emailOf(p2)),
    seed: null,
    status: "confirmed",
    createdAt,
  };
}

/** Parejas de ejemplo: 8 por categoría en los torneos jugados y algunas ya apuntadas al abierto. */
function seededRegistrations(): Registration[] {
  const [summer, autumn, open] = seededTournaments();
  const regs: Registration[] = [];
  for (const category of CATEGORIES) {
    const pairs = seedPairs(category);
    // En cada torneo el orden de inscripción cambia, así que las cabezas de serie también.
    pairs.forEach((p, i) => regs.push(makeRegistration(summer, category, i, p)));
    [...pairs].reverse().forEach((p, i) => regs.push(makeRegistration(autumn, category, i, p)));
    const openCount = { masculino: 6, femenino: 4, mixto: 5 }[category];
    pairs.slice(0, openCount).forEach((p, i) => regs.push(makeRegistration(open, category, i, p)));
  }
  return regs;
}

/** Resultados de los torneos ya jugados: suele ganar el mejor cabeza de serie, no siempre. */
function seededResults(tournamentId: string, category: Category, bracketPairs: Pair[]): MatchResult[] {
  const results: MatchResult[] = [];
  const bySeed = [...bracketPairs].sort((x, y) => x.seed! - y.seed!);
  // Orden de las 8 parejas en el cuadro de primera ronda.
  let current = seedOrder(8).map((s) => bySeed[s - 1]);
  let round = 0;
  while (current.length > 1) {
    const next: Pair[] = [];
    for (let position = 0; position < current.length / 2; position++) {
      const a = current[position * 2];
      const b = current[position * 2 + 1];
      const key = `${tournamentId}|${category}|${round}|${position}`;
      const favourite = a.seed! < b.seed! ? "a" : "b";
      const winner: "a" | "b" = stableRandom(key) < 0.7 ? favourite : favourite === "a" ? "b" : "a";
      const games = ["6-3", "6-4", "7-5", "6-2", "7-6"];
      const pick = (n: number) => games[Math.floor(stableRandom(`${key}|${n}`) * games.length)];
      const score = stableRandom(`${key}|sets`) < 0.3 ? `${pick(1)} 4-6 10-7` : `${pick(1)} ${pick(2)}`;
      results.push({ tournamentId, category, round, position, winner, score });
      next.push(winner === "a" ? a : b);
    }
    current = next;
    round++;
  }
  return results;
}

// --- Composición del estado -----------------------------------------------------------------

function allTournaments(s: TournamentState): Tournament[] {
  return [
    ...seededTournaments().map((t) => (s.g.includes(t.id) ? { ...t, bracketGenerated: true } : t)),
    ...s.t,
  ].sort((x, y) => x.date.localeCompare(y.date));
}

function allRegistrations(s: TournamentState): Registration[] {
  return [...seededRegistrations(), ...s.r].map((r) => (s.c.includes(r.id) ? { ...r, status: "cancelled" as const } : r));
}

const toPair = ({ id, tournamentId, category, player1Name, player2Name, player1Key, player2Key, seed, createdAt }: Registration): Pair => ({
  id,
  tournamentId,
  category,
  player1Name,
  player2Name,
  player1Key,
  player2Key,
  seed,
  createdAt,
});

/**
 * Parejas con cabeza de serie. En la demo no se guardan las cabezas de serie:
 * se recalculan siempre igual a partir del ranking previo al torneo.
 */
function buildWorld(s: TournamentState) {
  const tournaments = allTournaments(s);
  const registrations = allRegistrations(s);
  const pairs: Pair[] = [];
  const results: MatchResult[] = [];
  for (const t of tournaments) {
    for (const category of t.categories) {
      const confirmed = registrations
        .filter((r) => r.tournamentId === t.id && r.category === category && r.status === "confirmed")
        .map(toPair);
      if (!t.bracketGenerated) {
        pairs.push(...confirmed);
        continue;
      }
      const ranking = computeRanking(category, tournaments, pairs, results, t.date);
      const seeds = new Map(assignSeeds(confirmed, ranking).map((x) => [x.id, x.seed]));
      const seeded = confirmed.map((p) => ({ ...p, seed: seeds.get(p.id) ?? null }));
      pairs.push(...seeded);
      if (t.id === "t-verano" || t.id === "t-otono") {
        results.push(...seededResults(t.id, category, seeded));
      } else {
        for (const [cat, round, position, w, score] of s.res[t.id] ?? []) {
          if (CATEGORIES[cat] === category) {
            results.push({ tournamentId: t.id, category, round, position, winner: w ? "b" : "a", score });
          }
        }
      }
    }
  }
  return { tournaments, registrations, pairs, results };
}

type TournamentMethods = Pick<
  Backend,
  | "listTournaments"
  | "getTournament"
  | "createTournament"
  | "listPairs"
  | "listUserRegistrations"
  | "listTournamentRegistrations"
  | "getRegistration"
  | "insertRegistration"
  | "cancelRegistration"
  | "generateBracket"
  | "listResults"
  | "setResult"
>;

export const demoTournaments: TournamentMethods = {
  async listTournaments() {
    return allTournaments(await readState());
  },

  async getTournament(id) {
    return allTournaments(await readState()).find((t) => t.id === id) ?? null;
  },

  async createTournament(input) {
    const s = await readState();
    const tournament: Tournament = { ...input, id: `t-${randomBytes(5).toString("hex")}`, bracketGenerated: false };
    s.t.push(tournament);
    await writeState(s);
    return tournament;
  },

  async listPairs(tournamentId) {
    const { pairs } = buildWorld(await readState());
    return tournamentId ? pairs.filter((p) => p.tournamentId === tournamentId) : pairs;
  },

  async listUserRegistrations(userId, email) {
    const key = playerKey(email);
    return allRegistrations(await readState()).filter((r) => r.userId === userId || r.player2Key === key);
  },

  async listTournamentRegistrations(tournamentId) {
    const { registrations, pairs } = buildWorld(await readState());
    return registrations
      .filter((r) => r.tournamentId === tournamentId)
      .map((r) => ({ ...r, seed: pairs.find((p) => p.id === r.id)?.seed ?? null }));
  },

  async getRegistration(id) {
    return allRegistrations(await readState()).find((r) => r.id === id) ?? null;
  },

  async insertRegistration(input) {
    const s = await readState();
    const tournament = allTournaments(s).find((t) => t.id === input.tournamentId);
    const rivals = allRegistrations(s).filter(
      (r) => r.tournamentId === input.tournamentId && r.category === input.category && r.status === "confirmed",
    );
    if (!tournament || rivals.length >= tournament.maxPairs) return { ok: false, error: "full" };
    const emails = rivals.flatMap((r) => [r.player1Email, r.player2Email]);
    if (emails.includes(input.player1Email) || emails.includes(input.player2Email)) return { ok: false, error: "duplicate" };
    s.r.push({
      ...input,
      id: `r-${randomBytes(5).toString("hex")}`,
      player1Key: playerKey(input.player1Email),
      player2Key: playerKey(input.player2Email),
      seed: null,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
    await writeState(s);
    return { ok: true };
  },

  async cancelRegistration(id) {
    const s = await readState();
    if (!s.c.includes(id)) s.c.push(id);
    await writeState(s);
  },

  async generateBracket(tournamentId) {
    const s = await readState();
    const created = s.t.find((t) => t.id === tournamentId);
    if (created) created.bracketGenerated = true;
    else if (!s.g.includes(tournamentId)) s.g.push(tournamentId);
    await writeState(s);
  },

  async listResults(tournamentId) {
    const { results } = buildWorld(await readState());
    return tournamentId ? results.filter((r) => r.tournamentId === tournamentId) : results;
  },

  async setResult({ tournamentId, category, round, position, winner, score }) {
    const s = await readState();
    const cat = CATEGORIES.indexOf(category);
    const list = (s.res[tournamentId] ?? []).filter(([c, r, p]) => !(c === cat && r === round && p === position));
    list.push([cat, round, position, winner === "b" ? 1 : 0, score]);
    s.res[tournamentId] = list;
    await writeState(s);
  },
};
