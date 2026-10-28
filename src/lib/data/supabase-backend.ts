import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { AcademyRequest, Backend, Booking, Role } from "./types";

/**
 * Backend con Supabase (PostgreSQL + Auth). Se activa al definir
 * NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * El esquema está en supabase/migrations.
 */

async function client() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: el middleware ya refresca la sesión.
        }
      },
    },
  });
}

interface BookingRow {
  id: string;
  user_id: string;
  court_id: number;
  date: string;
  slot: string;
  status: Booking["status"];
  created_at: string;
  profiles?: { name: string; email: string } | null;
}

const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  userId: row.user_id,
  courtId: row.court_id,
  date: row.date,
  slot: row.slot,
  status: row.status,
  createdAt: row.created_at,
  userName: row.profiles?.name,
  userEmail: row.profiles?.email,
});

interface AcademyRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  for_whom: AcademyRequest["forWhom"];
  child_age: number | null;
  experience: AcademyRequest["experience"];
  preferred_days: number[];
  preferred_time: AcademyRequest["preferredTime"];
  test_date: string | null;
  test_slot: string | null;
  notes: string | null;
  status: AcademyRequest["status"];
  assessed_level: AcademyRequest["assessedLevel"];
  group_id: string | null;
  created_at: string;
}

const toAcademyRequest = (r: AcademyRow): AcademyRequest => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  forWhom: r.for_whom,
  childAge: r.child_age,
  experience: r.experience,
  preferredDays: r.preferred_days ?? [],
  preferredTime: r.preferred_time,
  testDate: r.test_date,
  testSlot: r.test_slot,
  notes: r.notes ?? "",
  status: r.status,
  assessedLevel: r.assessed_level,
  groupId: r.group_id,
  createdAt: r.created_at,
});

export const supabaseBackend: Backend = {
  mode: "supabase",

  async getCurrentUser() {
    const supabase = await client();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("name, role").eq("id", user.id).single();
    return {
      id: user.id,
      email: user.email ?? "",
      name: profile?.name ?? user.email ?? "",
      role: (profile?.role as Role) ?? "player",
    };
  },

  async signIn(email, password) {
    const supabase = await client();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { ok: true };
    return { ok: false, error: error.code === "email_not_confirmed" ? "unconfirmed" : "invalid" };
  },

  async signUp(name, email, password) {
    const supabase = await client();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    // Sin sesión: el proyecto exige confirmar el email antes de entrar.
    if (!error) return { ok: true, needsConfirmation: !data.session };
    if (error.code === "user_already_exists") return { ok: false, error: "exists" };
    if (error.code === "weak_password") return { ok: false, error: "weak" };
    return { ok: false, error: "unknown" };
  },

  async signOut() {
    const supabase = await client();
    await supabase.auth.signOut();
  },

  async getOccupied(date) {
    const supabase = await client();
    const { data, error } = await supabase.rpc("occupied_slots", { p_date: date });
    if (error) throw error;
    return (data ?? []).map((r: { court_id: number; slot: string; kind: "booked" | "blocked"; mine: boolean }) => ({
      courtId: r.court_id,
      slot: r.slot,
      kind: r.kind,
      mine: r.mine,
    }));
  },

  async insertBooking({ userId, courtId, date, slot }) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("bookings")
      .insert({ user_id: userId, court_id: courtId, date, slot })
      .select()
      .single();
    // 23505: índice único de pista/fecha/turno. P0001: trigger de pista bloqueada.
    if (error?.code === "23505" || error?.code === "P0001") return { ok: false, error: "taken" };
    if (error) throw error;
    return { ok: true, booking: toBooking(data) };
  },

  async getBooking(id) {
    const supabase = await client();
    const { data } = await supabase.from("bookings").select().eq("id", id).maybeSingle();
    return data ? toBooking(data) : null;
  },

  async markCancelled(id) {
    const supabase = await client();
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) throw error;
  },

  async listUserBookings(userId) {
    const supabase = await client();
    const { data, error } = await supabase.from("bookings").select().eq("user_id", userId);
    if (error) throw error;
    return data.map(toBooking);
  },

  async listDayBookings(date) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("bookings")
      .select("*, profiles(name, email)")
      .eq("date", date)
      .eq("status", "confirmed");
    if (error) throw error;
    return data.map(toBooking);
  },

  async listBlocks(date) {
    const supabase = await client();
    const { data, error } = await supabase.from("blocks").select().eq("date", date);
    if (error) throw error;
    return data.map((b) => ({ courtId: b.court_id, date: b.date, slot: b.slot }));
  },

  async setBlocked({ courtId, date, slot }, blocked) {
    const supabase = await client();
    const { error } = blocked
      ? await supabase.from("blocks").upsert({ court_id: courtId, date, slot })
      : await supabase.from("blocks").delete().match({ court_id: courtId, date, slot });
    if (error) throw error;
  },

  async insertAcademyRequest(r) {
    const supabase = await client();
    // Sin .select(): un visitante sin cuenta puede enviar la solicitud pero no leerla.
    const { error } = await supabase.from("academy_requests").insert({
      user_id: r.userId,
      name: r.name,
      email: r.email,
      phone: r.phone,
      for_whom: r.forWhom,
      child_age: r.childAge,
      experience: r.experience,
      preferred_days: r.preferredDays,
      preferred_time: r.preferredTime,
      test_date: r.testDate,
      test_slot: r.testSlot,
      notes: r.notes || null,
    });
    if (error) throw error;
  },

  async levelTestCounts() {
    const supabase = await client();
    const { data, error } = await supabase.rpc("level_test_counts");
    if (error) throw error;
    return (data ?? []).map((r: { test_date: string; test_slot: string; n: number }) => ({
      date: r.test_date,
      slot: r.test_slot,
      count: Number(r.n),
    }));
  },

  async groupMemberCounts() {
    const supabase = await client();
    const { data, error } = await supabase.rpc("academy_group_counts");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r: { group_id: string; n: number }) => [r.group_id, Number(r.n)]));
  },

  async listAcademyRequests() {
    const supabase = await client();
    const { data, error } = await supabase.from("academy_requests").select().order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(toAcademyRequest);
  },

  async listUserAcademyRequests(userId) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("academy_requests")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(toAcademyRequest);
  },

  async getAcademyRequest(id) {
    const supabase = await client();
    const { data } = await supabase.from("academy_requests").select().eq("id", id).maybeSingle();
    return data ? toAcademyRequest(data) : null;
  },

  async updateAcademyRequest(id, { status, assessedLevel, groupId }) {
    const supabase = await client();
    const { error } = await supabase
      .from("academy_requests")
      .update({ status, assessed_level: assessedLevel, group_id: groupId })
      .eq("id", id);
    if (error) throw error;
  },
};
