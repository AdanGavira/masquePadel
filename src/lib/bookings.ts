import "server-only";
import { isAcademyCell } from "./academy";
import { CLUB } from "./club";
import { backend, type Booking, type User } from "./data";
import { canCancel, hasSlotStarted, isBookableDate, isValidCourt, isValidSlot } from "./slots";

/** Reglas de negocio de las reservas, comunes a cualquier backend. */

export type BookError = "auth" | "invalid" | "past" | "taken" | "limit";
export type CancelError = "auth" | "notFound" | "tooLate";

export function isUpcoming(b: Booking, now = new Date()) {
  return b.status === "confirmed" && !hasSlotStarted(b.date, b.slot, now);
}

export async function bookSlot(
  user: User | null,
  input: { courtId: unknown; date: unknown; slot: unknown },
): Promise<{ ok: true; booking: Booking } | { ok: false; error: BookError }> {
  if (!user) return { ok: false, error: "auth" };
  const { courtId, date, slot } = input;
  if (!isValidCourt(courtId) || !isBookableDate(date) || !isValidSlot(slot)) return { ok: false, error: "invalid" };
  if (hasSlotStarted(date, slot)) return { ok: false, error: "past" };
  if (isAcademyCell(date, courtId, slot)) return { ok: false, error: "taken" };

  const active = (await backend.listUserBookings(user.id)).filter((b) => isUpcoming(b));
  if (active.length >= CLUB.maxActiveBookingsPerUser) return { ok: false, error: "limit" };

  return backend.insertBooking({ userId: user.id, courtId, date, slot });
}

export async function cancelBooking(
  user: User | null,
  bookingId: string,
): Promise<{ ok: true } | { ok: false; error: CancelError }> {
  if (!user) return { ok: false, error: "auth" };
  const booking = await backend.getBooking(bookingId);
  const isAdmin = user.role === "admin";
  if (!booking || booking.status !== "confirmed" || (booking.userId !== user.id && !isAdmin)) {
    return { ok: false, error: "notFound" };
  }
  if (!isAdmin && !canCancel(booking.date, booking.slot)) return { ok: false, error: "tooLate" };
  await backend.markCancelled(booking.id);
  return { ok: true };
}
