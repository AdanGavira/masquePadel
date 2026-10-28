import "server-only";
import { backend, type User } from "./data";
import { getSlots } from "./slots";
import { addDays, isValidDateKey, todayKey } from "./time";
import {
  CATEGORIES,
  MAX_SCORE,
  PAIR_SIZES,
  assignSeeds,
  buildBracket,
  canSetResult,
  computeRanking,
  isWeekend,
  registrationOpen,
  type Category,
  type Match,
} from "./tournaments";

/** Reglas de los torneos, comunes a cualquier backend. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isCategory = (v: unknown): v is Category => CATEGORIES.includes(v as Category);
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function loadWorld() {
  const [tournaments, pairs, results] = await Promise.all([
    backend.listTournaments(),
    backend.listPairs(),
    backend.listResults(),
  ]);
  return { tournaments, pairs, results };
}

export async function rankingFor(category: Category) {
  const { tournaments, pairs, results } = await loadWorld();
  return computeRanking(category, tournaments, pairs, results);
}

export async function tournamentView(id: string) {
  const tournament = await backend.getTournament(id);
  if (!tournament) return null;
  const [pairs, results] = await Promise.all([backend.listPairs(id), backend.listResults(id)]);
  const brackets = Object.fromEntries(
    tournament.categories.map((c) => [
      c,
      buildBracket(
        pairs.filter((p) => p.category === c),
        results.filter((r) => r.category === c),
      ),
    ]),
  ) as Partial<Record<Category, Match[][]>>;
  return { tournament, pairs, results, brackets };
}

export type RegisterError = "auth" | "closed" | "fields" | "full" | "duplicate" | "self";

export async function registerPair(user: User | null, form: FormData): Promise<{ ok: true } | { ok: false; error: RegisterError }> {
  if (!user) return { ok: false, error: "auth" };
  const tournament = await backend.getTournament(text(form, "tournamentId"));
  if (!tournament || !registrationOpen(tournament)) return { ok: false, error: "closed" };

  const category = text(form, "category");
  const partnerName = text(form, "partnerName");
  const partnerEmail = text(form, "partnerEmail").toLowerCase();
  if (!isCategory(category) || !tournament.categories.includes(category)) return { ok: false, error: "fields" };
  if (!partnerName || partnerName.length > 80 || !EMAIL.test(partnerEmail) || partnerEmail.length > 120) {
    return { ok: false, error: "fields" };
  }
  const ownEmail = user.email.toLowerCase();
  if (partnerEmail === ownEmail) return { ok: false, error: "self" };

  const pairs = (await backend.listPairs(tournament.id)).filter((p) => p.category === category);
  if (pairs.length >= tournament.maxPairs) return { ok: false, error: "full" };

  // El backend comprueba además, con todos los datos, que ningún jugador repita en la categoría.
  return backend.insertRegistration({
    tournamentId: tournament.id,
    category,
    userId: user.id,
    player1Name: user.name,
    player1Email: ownEmail,
    player2Name: partnerName,
    player2Email: partnerEmail,
  });
}

export async function cancelRegistration(user: User | null, id: string): Promise<boolean> {
  if (!user) return false;
  const registration = await backend.getRegistration(id);
  if (!registration || registration.status !== "confirmed") return false;
  const isAdmin = user.role === "admin";
  if (!isAdmin && registration.userId !== user.id) return false;
  const tournament = await backend.getTournament(registration.tournamentId);
  if (!tournament || (!isAdmin && !registrationOpen(tournament))) return false;
  await backend.cancelRegistration(id);
  return true;
}

export type CreateTournamentError = "forbidden" | "fields" | "date";

export async function createTournament(
  user: User | null,
  form: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: CreateTournamentError }> {
  if (user?.role !== "admin") return { ok: false, error: "forbidden" };
  const name = text(form, "name");
  const date = text(form, "date");
  const startSlot = text(form, "startSlot");
  const endSlot = text(form, "endSlot");
  const categories = form.getAll("categories").filter(isCategory);
  const maxPairs = Number(text(form, "maxPairs"));
  const pricePerPair = Number(text(form, "pricePerPair"));
  const closesDaysBefore = Number(text(form, "closesDaysBefore"));

  const slots = getSlots();
  if (
    name.length < 3 ||
    name.length > 80 ||
    !isValidDateKey(date) ||
    !slots.includes(startSlot) ||
    !slots.includes(endSlot) ||
    endSlot < startSlot ||
    categories.length === 0 ||
    !(PAIR_SIZES as readonly number[]).includes(maxPairs) ||
    !Number.isInteger(pricePerPair) ||
    pricePerPair < 0 ||
    pricePerPair > 500 ||
    !Number.isInteger(closesDaysBefore) ||
    closesDaysBefore < 0 ||
    closesDaysBefore > 14
  ) {
    return { ok: false, error: "fields" };
  }
  // Fin de semana y fuera de la ventana de reservas, para no pisar reservas ya hechas.
  if (!isWeekend(date) || date <= addDays(todayKey(), 14)) return { ok: false, error: "date" };

  const tournament = await backend.createTournament({
    name,
    date,
    startSlot,
    endSlot,
    categories: CATEGORIES.filter((c) => categories.includes(c)),
    maxPairs,
    pricePerPair,
    registrationCloses: addDays(date, -closesDaysBefore),
  });
  return { ok: true, id: tournament.id };
}

export type BracketError = "forbidden" | "notFound" | "already" | "fewPairs";

export async function generateBracket(user: User | null, tournamentId: string): Promise<{ ok: true } | { ok: false; error: BracketError }> {
  if (user?.role !== "admin") return { ok: false, error: "forbidden" };
  const tournament = await backend.getTournament(tournamentId);
  if (!tournament) return { ok: false, error: "notFound" };
  if (tournament.bracketGenerated) return { ok: false, error: "already" };

  const { tournaments, pairs, results } = await loadWorld();
  const own = pairs.filter((p) => p.tournamentId === tournamentId);
  const seeds = tournament.categories.flatMap((category) => {
    const inCategory = own.filter((p) => p.category === category);
    const ranking = computeRanking(category, tournaments, pairs, results, tournament.date);
    return assignSeeds(inCategory, ranking);
  });
  const withPairs = tournament.categories.filter((c) => own.some((p) => p.category === c));
  if (withPairs.length === 0 || withPairs.some((c) => own.filter((p) => p.category === c).length < 2)) {
    return { ok: false, error: "fewPairs" };
  }
  await backend.generateBracket(tournamentId, seeds);
  return { ok: true };
}

export type ResultError = "forbidden" | "invalid" | "locked";

export async function setResult(user: User | null, form: FormData): Promise<{ ok: true } | { ok: false; error: ResultError }> {
  if (user?.role !== "admin") return { ok: false, error: "forbidden" };
  const view = await tournamentView(text(form, "tournamentId"));
  const category = text(form, "category");
  const round = Number(text(form, "round"));
  const position = Number(text(form, "position"));
  const winner = text(form, "winner");
  const score = text(form, "score").replace(/\s+/g, " ");
  if (!view || !isCategory(category) || (winner !== "a" && winner !== "b") || !score || score.length > MAX_SCORE) {
    return { ok: false, error: "invalid" };
  }
  const bracket = view.brackets[category];
  if (!bracket || !canSetResult(bracket, round, position)) return { ok: false, error: "locked" };
  await backend.setResult({ tournamentId: view.tournament.id, category, round, position, winner, score });
  return { ok: true };
}
