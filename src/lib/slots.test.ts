import { describe, expect, it } from "vitest";
import { bookableDates, canCancel, getSlots, hasSlotStarted, isBookableDate } from "./slots";
import { clubTimeToDate, todayKey } from "./time";

describe("getSlots", () => {
  it("genera 10 turnos de 90 min de 08:00 a 21:30", () => {
    expect(getSlots()).toEqual([
      "08:00", "09:30", "11:00", "12:30", "14:00",
      "15:30", "17:00", "18:30", "20:00", "21:30",
    ]);
  });
});

describe("zona horaria del club", () => {
  it("convierte hora de Sevilla en verano (UTC+2)", () => {
    expect(clubTimeToDate("2026-07-15", "21:30").toISOString()).toBe("2026-07-15T19:30:00.000Z");
  });

  it("convierte hora de Sevilla en invierno (UTC+1)", () => {
    expect(clubTimeToDate("2026-12-15", "08:00").toISOString()).toBe("2026-12-15T07:00:00.000Z");
  });

  it("usa la fecha de Sevilla aunque en UTC sea otro día", () => {
    expect(todayKey(new Date("2026-07-15T22:30:00Z"))).toBe("2026-07-16");
  });
});

describe("reglas de reserva", () => {
  const now = new Date("2026-07-15T10:00:00Z"); // 12:00 en Sevilla

  it("permite reservar desde hoy durante 14 días", () => {
    const dates = bookableDates(now);
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe("2026-07-15");
    expect(dates[13]).toBe("2026-07-28");
    expect(isBookableDate("2026-07-29", now)).toBe(false);
    expect(isBookableDate("2026-07-14", now)).toBe(false);
  });

  it("detecta turnos que ya han empezado", () => {
    expect(hasSlotStarted("2026-07-15", "11:00", now)).toBe(true);
    expect(hasSlotStarted("2026-07-15", "12:30", now)).toBe(false);
  });

  it("solo deja cancelar con 24 h de antelación", () => {
    expect(canCancel("2026-07-16", "12:00", now)).toBe(true);
    expect(canCancel("2026-07-16", "11:00", now)).toBe(false);
  });
});
