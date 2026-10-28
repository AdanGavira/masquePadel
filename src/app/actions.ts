"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { bookSlot, cancelBooking, type BookError, type CancelError } from "@/lib/bookings";
import { backend, type AuthError } from "@/lib/data";
import { href, isLocale, type Locale } from "@/lib/i18n";
import { isBookableDate, isValidCourt, isValidSlot } from "@/lib/slots";

export type FormState = { error?: AuthError | "fields"; notice?: "confirm" } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Solo permite volver a rutas internas del propio sitio. */
function safeNext(locale: Locale, next: FormDataEntryValue | null) {
  return typeof next === "string" && next.startsWith(`/${locale}/`) && !next.startsWith("//")
    ? next
    : href(locale, "/reservas");
}

function readLocale(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return isLocale(value) ? value : "es";
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const locale = readLocale(formData);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL.test(email) || !password) return { error: "fields" };

  const result = await backend.signIn(email, password);
  if (!result.ok) return { error: result.error };
  redirect(safeNext(locale, formData.get("next")));
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const locale = readLocale(formData);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name || name.length > 80 || !EMAIL.test(email)) return { error: "fields" };
  if (password.length < 8) return { error: "weak" };

  const result = await backend.signUp(name, email, password);
  if (!result.ok) return { error: result.error };
  if (result.needsConfirmation) return { notice: "confirm" };
  redirect(safeNext(locale, formData.get("next")));
}

export async function logoutAction(formData: FormData) {
  await backend.signOut();
  redirect(href(readLocale(formData)));
}

export async function setLocaleCookie(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set("mp_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function bookAction(input: {
  courtId: number;
  date: string;
  slot: string;
}): Promise<{ ok: true } | { ok: false; error: BookError }> {
  const user = await backend.getCurrentUser();
  const result = await bookSlot(user, input);
  revalidatePath("/[locale]/reservas", "page");
  revalidatePath("/[locale]/mis-reservas", "page");
  return result.ok ? { ok: true } : result;
}

export async function cancelAction(bookingId: string): Promise<{ ok: true } | { ok: false; error: CancelError }> {
  const user = await backend.getCurrentUser();
  const result = await cancelBooking(user, bookingId);
  revalidatePath("/[locale]", "layout");
  return result;
}

async function requireAdmin() {
  const user = await backend.getCurrentUser();
  if (user?.role !== "admin") throw new Error("Forbidden");
  return user;
}

export async function adminCancelAction(formData: FormData) {
  const user = await requireAdmin();
  await cancelBooking(user, String(formData.get("bookingId")));
  revalidatePath("/[locale]", "layout");
}

export async function adminBlockAction(formData: FormData) {
  await requireAdmin();
  const courtId = Number(formData.get("courtId"));
  const date = formData.get("date");
  const slot = formData.get("slot");
  if (!isValidCourt(courtId) || !isBookableDate(date) || !isValidSlot(slot)) return;
  await backend.setBlocked({ courtId, date, slot }, formData.get("blocked") === "true");
  revalidatePath("/[locale]", "layout");
}
