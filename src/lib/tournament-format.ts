import type { Dictionary } from "./i18n";
import { champion, registrationOpen, type Match, type Tournament } from "./tournaments";

export type TournamentStatus = "open" | "closed" | "inPlay" | "finished";

export function statusOf(t: Tournament, brackets: Match[][][]): TournamentStatus {
  if (!t.bracketGenerated) return registrationOpen(t) ? "open" : "closed";
  return brackets.length > 0 && brackets.every((b) => b.length === 0 || champion(b)) ? "finished" : "inPlay";
}

/** Nombre de la ronda contando desde la final. */
export function roundName(dict: Dictionary, round: number, total: number) {
  const r = dict.tournaments.detail.rounds;
  return [r.final, r.semi, r.quarter, r.r16][total - 1 - round] ?? `R${round + 1}`;
}
