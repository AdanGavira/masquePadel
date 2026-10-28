import { describe, expect, it } from "vitest";
import { GROUPS, LEVEL_TEST, academyCells, isAcademyCell, upcomingLevelTests, weekday } from "./academy";
import { getSlots } from "./slots";

describe("academia", () => {
  it("los grupos y pruebas de nivel usan turnos válidos y no se pisan", () => {
    const seen = new Set<string>();
    for (const g of GROUPS) {
      expect(getSlots()).toContain(g.slot);
      for (const d of g.days) {
        const key = `${d}|${g.courtId}|${g.slot}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
    for (const d of LEVEL_TEST.days) {
      for (const slot of LEVEL_TEST.slots) {
        expect(getSlots()).toContain(slot);
        expect(seen.has(`${d}|${LEVEL_TEST.courtId}|${slot}`)).toBe(false);
      }
    }
  });

  it("ocupa la pista 4 los lunes a las 17:00 con iniciación", () => {
    expect(weekday("2026-11-02")).toBe(1);
    expect(academyCells("2026-11-02")).toContainEqual({ courtId: 4, slot: "17:00", groupId: "ini-lx" });
    expect(isAcademyCell("2026-11-02", 4, "17:00")).toBe(true);
    expect(isAcademyCell("2026-11-02", 1, "17:00")).toBe(false);
  });

  it("ofrece las pruebas de nivel de los próximos sábados que no han empezado", () => {
    const now = new Date("2026-10-31T09:00:00Z"); // sábado 10:00 en Sevilla
    const tests = upcomingLevelTests(now);
    expect(tests[0]).toEqual({ date: "2026-10-31", slot: "11:00" });
    expect(tests.every((t) => weekday(t.date) === 6)).toBe(true);
    expect(tests).toHaveLength(3);
  });
});
