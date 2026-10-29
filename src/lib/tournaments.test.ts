import { describe, expect, it } from "vitest";
import {
  assignSeeds,
  buildBracket,
  canSetResult,
  champion,
  computeRanking,
  seedOrder,
  type MatchResult,
  type Pair,
  type Tournament,
} from "./tournaments";

const pair = (n: number, seed: number | null = n, t = "t1"): Pair => ({
  id: `p${n}`,
  tournamentId: t,
  category: "masculino",
  player1Name: `A${n}`,
  player2Name: `B${n}`,
  player1Key: `a${n}`,
  player2Key: `b${n}`,
  seed,
  createdAt: `2026-01-01T00:00:0${n % 10}Z`,
});

const result = (round: number, position: number, winner: "a" | "b", t = "t1"): MatchResult => ({
  tournamentId: t,
  category: "masculino",
  round,
  position,
  winner,
  score: "6-4 6-4",
});

const tournament = (id: string, date: string): Tournament => ({
  id,
  name: id,
  date,
  startSlot: "09:30",
  endSlot: "20:00",
  categories: ["masculino"],
  maxPairs: 8,
  pricePerPair: 30,
  registrationCloses: date,
  bracketGenerated: true,
});

describe("cuadro eliminatorio", () => {
  it("coloca las cabezas de serie para que 1 y 2 solo se crucen en la final", () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("da pase directo a los mejores cuando faltan parejas", () => {
    const bracket = buildBracket([1, 2, 3, 4, 5, 6].map((n) => pair(n)), []);
    expect(bracket).toHaveLength(3);
    const first = bracket[0];
    expect(first[0].bye).toBe(true);
    expect(first[0].winner?.id).toBe("p1");
    expect(first[2].winner?.id).toBe("p2");
    expect(bracket[1][0].a?.id).toBe("p1");
  });

  it("hace avanzar a los ganadores y calcula el campeón", () => {
    const pairs = [1, 2, 3, 4].map((n) => pair(n));
    const bracket = buildBracket(pairs, [result(0, 0, "a"), result(0, 1, "b"), result(1, 0, "b")]);
    // Semifinales: 1 vs 4 y 2 vs 3. Gana 1 y gana 3; la final la gana 3.
    expect(bracket[1][0].a?.id).toBe("p1");
    expect(bracket[1][0].b?.id).toBe("p3");
    expect(champion(bracket)?.id).toBe("p3");
  });

  it("no deja cambiar un resultado si la siguiente ronda ya se jugó", () => {
    const pairs = [1, 2, 3, 4].map((n) => pair(n));
    const bracket = buildBracket(pairs, [result(0, 0, "a"), result(0, 1, "a"), result(1, 0, "a")]);
    expect(canSetResult(bracket, 0, 0)).toBe(false);
    expect(canSetResult(bracket, 1, 0)).toBe(true);
  });
});

describe("ranking", () => {
  it("reparte 100/60/35 en un cuadro de 4 parejas y suma por jugador", () => {
    const pairs = [1, 2, 3, 4].map((n) => pair(n));
    const results = [result(0, 0, "a"), result(0, 1, "a"), result(1, 0, "a")];
    const ranking = computeRanking("masculino", [tournament("t1", "2026-01-10")], pairs, results);
    const points = Object.fromEntries(ranking.map((r) => [r.key, r.points]));
    expect(points).toMatchObject({ a1: 100, b1: 100, a2: 60, a3: 35, a4: 35 });
    expect(ranking[0].titles).toBe(1);
  });

  it("ignora cuadros sin terminar y usa el ranking para las cabezas de serie", () => {
    const pairs = [1, 2, 3, 4].map((n) => pair(n));
    expect(computeRanking("masculino", [tournament("t1", "2026-01-10")], pairs, [result(0, 0, "a")])).toEqual([]);

    const ranking = computeRanking(
      "masculino",
      [tournament("t1", "2026-01-10")],
      pairs,
      [result(0, 0, "b"), result(0, 1, "a"), result(1, 0, "a")],
    );
    // p4 ganó a p1 en semifinales y después la final contra p2.
    const seeds = assignSeeds([1, 2, 3, 4].map((n) => pair(n, null, "t2")), ranking);
    expect(seeds.map((s) => s.id)).toEqual(["p4", "p2", "p1", "p3"]);
  });
});
