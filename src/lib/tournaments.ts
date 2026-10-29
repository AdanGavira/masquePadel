import { getSlots } from "./slots";
import { todayKey, type DateKey } from "./time";

/**
 * Torneos de fin de semana: cuadro eliminatorio por categoría y ranking
 * individual por puntos. Lógica pura, sin acceso a datos.
 */

export type Category = "masculino" | "femenino" | "mixto";
export const CATEGORIES: Category[] = ["masculino", "femenino", "mixto"];

/** Pistas que ocupa un torneo; la 4 queda para la academia y reservas. */
export const TOURNAMENT_COURTS = [1, 2, 3];
export const PAIR_SIZES = [8, 16] as const;

/** Puntos de ranking según la ronda alcanzada. */
export const POINTS = { champion: 100, final: 60, semi: 35, quarter: 20, played: 5 } as const;

export interface Tournament {
  id: string;
  name: string;
  date: DateKey;
  /** Primer y último turno que ocupa en las pistas del torneo. */
  startSlot: string;
  endSlot: string;
  categories: Category[];
  maxPairs: number;
  pricePerPair: number;
  /** Último día para inscribirse (incluido). */
  registrationCloses: DateKey;
  bracketGenerated: boolean;
}

/** Pareja inscrita tal y como se muestra en público (sin emails). */
export interface Pair {
  id: string;
  tournamentId: string;
  category: Category;
  player1Name: string;
  player2Name: string;
  /** Identificadores estables de cada jugador para el ranking. */
  player1Key: string;
  player2Key: string;
  /** Cabeza de serie (1 = mejor), asignada al generar el cuadro. */
  seed: number | null;
  createdAt: string;
}

export interface MatchResult {
  tournamentId: string;
  category: Category;
  /** 0 = primera ronda … rondas − 1 = final. */
  round: number;
  position: number;
  winner: "a" | "b";
  score: string;
}

export interface Match {
  round: number;
  position: number;
  a: Pair | null;
  b: Pair | null;
  /** Un lado es un hueco vacío del cuadro: pasa el otro sin jugar. */
  bye: boolean;
  winner: Pair | null;
  score: string | null;
}

export function weekdayOf(date: DateKey) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isWeekend(date: DateKey) {
  const day = weekdayOf(date);
  return day === 0 || day === 6;
}

export function registrationOpen(t: Tournament, now = new Date()) {
  return !t.bracketGenerated && todayKey(now) <= t.registrationCloses;
}

export function tournamentSlots(t: Tournament) {
  return getSlots().filter((s) => s >= t.startSlot && s <= t.endSlot);
}

export function tournamentCells(tournaments: Tournament[], date: DateKey) {
  return tournaments
    .filter((t) => t.date === date)
    .flatMap((t) => TOURNAMENT_COURTS.flatMap((courtId) => tournamentSlots(t).map((slot) => ({ courtId, slot, tournamentId: t.id }))));
}

/** Orden clásico de cabezas de serie: 8 → [1, 8, 4, 5, 2, 7, 3, 6]. */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const next = order.length * 2 + 1;
    order = order.flatMap((s) => [s, next - s]);
  }
  return order;
}

export function bracketSize(pairs: number) {
  let size = 2;
  while (size < pairs) size *= 2;
  return size;
}

export function roundCount(size: number) {
  return Math.log2(size);
}

/** Construye el cuadro de una categoría a partir de las parejas con cabeza de serie y los resultados. */
export function buildBracket(pairs: Pair[], results: MatchResult[]): Match[][] {
  const seeded = pairs.filter((p) => p.seed !== null).sort((x, y) => x.seed! - y.seed!);
  if (seeded.length < 2) return [];
  const size = bracketSize(seeded.length);
  const bySeed = new Map(seeded.map((p) => [p.seed!, p]));
  const slots = seedOrder(size).map((s) => bySeed.get(s) ?? null);
  const rounds: Match[][] = [];
  const result = (round: number, position: number) => results.find((r) => r.round === round && r.position === position);

  for (let round = 0; round < roundCount(size); round++) {
    const matches: Match[] = [];
    const count = size / 2 ** (round + 1);
    for (let position = 0; position < count; position++) {
      let a: Pair | null;
      let b: Pair | null;
      let bye = false;
      if (round === 0) {
        a = slots[position * 2];
        b = slots[position * 2 + 1];
        bye = !a || !b;
      } else {
        const prev = rounds[round - 1];
        a = prev[position * 2].winner;
        b = prev[position * 2 + 1].winner;
      }
      let winner: Pair | null = null;
      let score: string | null = null;
      if (bye) {
        winner = a ?? b;
      } else if (a && b) {
        const r = result(round, position);
        if (r) {
          winner = r.winner === "a" ? a : b;
          score = r.score;
        }
      }
      matches.push({ round, position, a, b, bye, winner, score });
    }
    rounds.push(matches);
  }
  return rounds;
}

export function champion(bracket: Match[][]): Pair | null {
  return bracket.at(-1)?.[0]?.winner ?? null;
}

/** Se puede anotar o cambiar el resultado si hay dos parejas y la siguiente ronda aún no se ha jugado. */
export function canSetResult(bracket: Match[][], round: number, position: number) {
  const match = bracket[round]?.[position];
  if (!match || match.bye || !match.a || !match.b) return false;
  const next = bracket[round + 1]?.[Math.floor(position / 2)];
  return !next || !next.score;
}

/** Puntos que gana cada pareja en un cuadro terminado. */
export function bracketPoints(bracket: Match[][]): Map<Pair, number> {
  const points = new Map<Pair, number>();
  if (!champion(bracket)) return points;
  const total = bracket.length;
  for (const round of bracket) {
    for (const m of round) {
      if (m.bye || !m.a || !m.b || !m.winner) continue;
      const loser = m.winner === m.a ? m.b : m.a;
      const fromEnd = total - 1 - m.round;
      points.set(loser, fromEnd === 0 ? POINTS.final : fromEnd === 1 ? POINTS.semi : fromEnd === 2 ? POINTS.quarter : POINTS.played);
    }
  }
  points.set(champion(bracket)!, POINTS.champion);
  return points;
}

export interface RankingRow {
  key: string;
  name: string;
  points: number;
  tournaments: number;
  titles: number;
}

/** Ranking individual de una categoría con todos los torneos terminados anteriores a `before`. */
export function computeRanking(
  category: Category,
  tournaments: Tournament[],
  pairs: Pair[],
  results: MatchResult[],
  before?: DateKey,
): RankingRow[] {
  const rows = new Map<string, RankingRow>();
  const add = (key: string, name: string, pts: number, title: boolean) => {
    const row = rows.get(key) ?? { key, name, points: 0, tournaments: 0, titles: 0 };
    row.points += pts;
    row.tournaments += 1;
    if (title) row.titles += 1;
    row.name = name;
    rows.set(key, row);
  };
  for (const t of [...tournaments].sort((x, y) => x.date.localeCompare(y.date))) {
    if (before && t.date >= before) continue;
    const bracket = buildBracket(
      pairs.filter((p) => p.tournamentId === t.id && p.category === category),
      results.filter((r) => r.tournamentId === t.id && r.category === category),
    );
    const winner = champion(bracket);
    for (const [pair, pts] of bracketPoints(bracket)) {
      add(pair.player1Key, pair.player1Name, pts, pair === winner);
      add(pair.player2Key, pair.player2Name, pts, pair === winner);
    }
  }
  return [...rows.values()].sort((x, y) => y.points - x.points || y.titles - x.titles || x.name.localeCompare(y.name));
}

/** Cabezas de serie: suma de puntos de ranking de la pareja y, a igualdad, orden de inscripción. */
export function assignSeeds(pairs: Pair[], ranking: RankingRow[]): { id: string; seed: number }[] {
  const pointsOf = (key: string) => ranking.find((r) => r.key === key)?.points ?? 0;
  return [...pairs]
    .sort(
      (x, y) =>
        pointsOf(y.player1Key) + pointsOf(y.player2Key) - (pointsOf(x.player1Key) + pointsOf(x.player2Key)) ||
        x.createdAt.localeCompare(y.createdAt),
    )
    .map((p, i) => ({ id: p.id, seed: i + 1 }));
}

export const MAX_SCORE = 40;
