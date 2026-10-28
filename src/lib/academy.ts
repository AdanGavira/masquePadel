import { bookableDates, hasSlotStarted } from "./slots";
import type { DateKey } from "./time";

/**
 * Configuración de la academia: cursos mensuales por niveles con horario
 * fijo semanal y pruebas de nivel gratuitas los sábados. Cada sesión ocupa
 * un turno de pista completo, así que no se puede reservar a la vez.
 */

export type Level = "iniciacion" | "intermedio" | "avanzado" | "infantil";
export const LEVELS: Level[] = ["iniciacion", "intermedio", "avanzado", "infantil"];

export interface Coach {
  id: string;
  name: string;
}

export const COACHES: Coach[] = [
  { id: "laura", name: "Laura Medina" },
  { id: "sergio", name: "Sergio Campos" },
];

export interface Group {
  id: string;
  level: Level;
  /** Días de la semana: 0 = domingo … 6 = sábado. */
  days: number[];
  slot: string;
  courtId: number;
  coachId: string;
  capacity: number;
  /** Precio mensual por alumno, en euros. */
  price: number;
}

export const GROUPS: Group[] = [
  { id: "ini-lx", level: "iniciacion", days: [1, 3], slot: "17:00", courtId: 4, coachId: "laura", capacity: 4, price: 110 },
  { id: "ini-mj", level: "iniciacion", days: [2, 4], slot: "20:00", courtId: 4, coachId: "sergio", capacity: 4, price: 110 },
  { id: "ini-s", level: "iniciacion", days: [6], slot: "12:30", courtId: 4, coachId: "laura", capacity: 4, price: 60 },
  { id: "int-lx", level: "intermedio", days: [1, 3], slot: "20:00", courtId: 3, coachId: "sergio", capacity: 4, price: 110 },
  { id: "av-mj", level: "avanzado", days: [2, 4], slot: "18:30", courtId: 3, coachId: "laura", capacity: 4, price: 110 },
  { id: "inf-v", level: "infantil", days: [5], slot: "17:00", courtId: 4, coachId: "sergio", capacity: 6, price: 40 },
];

/** Pruebas de nivel: gratuitas, los sábados por la mañana en la pista 4. */
export const LEVEL_TEST = {
  days: [6],
  slots: ["09:30", "11:00"],
  courtId: 4,
  capacity: 4,
} as const;

export const getGroup = (id: string | null | undefined) => GROUPS.find((g) => g.id === id) ?? null;
export const getCoach = (id: string) => COACHES.find((c) => c.id === id)!;

export function weekday(date: DateKey): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export interface AcademyCell {
  courtId: number;
  slot: string;
  /** Id del grupo, o null si es una prueba de nivel. */
  groupId: string | null;
}

/** Pistas que ocupa la academia en una fecha. */
export function academyCells(date: DateKey): AcademyCell[] {
  const day = weekday(date);
  const cells: AcademyCell[] = GROUPS.filter((g) => g.days.includes(day)).map((g) => ({
    courtId: g.courtId,
    slot: g.slot,
    groupId: g.id,
  }));
  if ((LEVEL_TEST.days as readonly number[]).includes(day)) {
    for (const slot of LEVEL_TEST.slots) cells.push({ courtId: LEVEL_TEST.courtId, slot, groupId: null });
  }
  return cells;
}

export function isAcademyCell(date: DateKey, courtId: number, slot: string) {
  return academyCells(date).some((c) => c.courtId === courtId && c.slot === slot);
}

/** Próximas sesiones de prueba de nivel dentro de la ventana de reservas. */
export function upcomingLevelTests(now = new Date()): { date: DateKey; slot: string }[] {
  return bookableDates(now)
    .filter((date) => (LEVEL_TEST.days as readonly number[]).includes(weekday(date)))
    .flatMap((date) => LEVEL_TEST.slots.map((slot) => ({ date, slot })))
    .filter(({ date, slot }) => !hasSlotStarted(date, slot, now));
}

export const MAX_NOTES = 300;
