import { CLUB, COURTS } from "./club";
import {
  addDays,
  clubTimeToDate,
  isValidDateKey,
  minutesToTime,
  timeToMinutes,
  todayKey,
  type DateKey,
} from "./time";

/** Turnos del día: empiezan a la apertura y el último termina justo al cierre. */
export function getSlots(): string[] {
  const slots: string[] = [];
  const close = timeToMinutes(CLUB.closesAt);
  for (let start = timeToMinutes(CLUB.opensAt); start + CLUB.slotMinutes <= close; start += CLUB.slotMinutes) {
    slots.push(minutesToTime(start));
  }
  return slots;
}

export function slotEnd(slot: string): string {
  return minutesToTime(timeToMinutes(slot) + CLUB.slotMinutes);
}

export function isValidSlot(slot: unknown): slot is string {
  return typeof slot === "string" && getSlots().includes(slot);
}

export function isValidCourt(court: unknown): court is number {
  return typeof court === "number" && COURTS.some((c) => c.id === court);
}

/** Días que se pueden reservar, empezando por hoy. */
export function bookableDates(now: Date = new Date()): DateKey[] {
  const today = todayKey(now);
  return Array.from({ length: CLUB.bookingWindowDays }, (_, i) => addDays(today, i));
}

export function isBookableDate(date: unknown, now: Date = new Date()): date is DateKey {
  return isValidDateKey(date) && bookableDates(now).includes(date);
}

export function hasSlotStarted(date: DateKey, slot: string, now: Date = new Date()): boolean {
  return clubTimeToDate(date, slot).getTime() <= now.getTime();
}

/** Se puede cancelar hasta `cancellationHours` antes del inicio. */
export function canCancel(date: DateKey, slot: string, now: Date = new Date()): boolean {
  const limit = clubTimeToDate(date, slot).getTime() - CLUB.cancellationHours * 3600_000;
  return now.getTime() <= limit;
}
