import { CLUB } from "./club";

/** Fecha (YYYY-MM-DD) en formato de calendario, sin hora. */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha y hora actuales en la zona horaria del club. */
export function clubNowParts(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLUB.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function todayKey(now: Date = new Date()): DateKey {
  const { year, month, day } = clubNowParts(now);
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function addDays(date: DateKey, days: number): DateKey {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Convierte una fecha y hora locales del club a un instante UTC. */
export function clubTimeToDate(date: DateKey, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  // Diferencia entre la hora "pared" del club y UTC en ese instante.
  const offsetAt = (instant: number) => {
    const p = clubNowParts(new Date(instant));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - instant;
  };
  let result = asUtc - offsetAt(asUtc);
  // Segunda pasada por si el cambio de hora cae entre medias.
  result = asUtc - offsetAt(result);
  return new Date(result);
}

export function minutesToTime(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
