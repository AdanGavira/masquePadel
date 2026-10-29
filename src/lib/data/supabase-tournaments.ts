import "server-only";
import type { Category, MatchResult, Pair, Tournament } from "../tournaments";
import { client } from "./supabase-client";
import type { Backend, Registration } from "./types";

/** Torneos con Supabase. El esquema está en supabase/migrations/0003_torneos.sql. */

interface TournamentRow {
  id: string;
  name: string;
  date: string;
  start_slot: string;
  end_slot: string;
  categories: Category[];
  max_pairs: number;
  price_per_pair: number;
  registration_closes: string;
  bracket_generated: boolean;
}

const toTournament = (r: TournamentRow): Tournament => ({
  id: r.id,
  name: r.name,
  date: r.date,
  startSlot: r.start_slot,
  endSlot: r.end_slot,
  categories: r.categories,
  maxPairs: r.max_pairs,
  pricePerPair: r.price_per_pair,
  registrationCloses: r.registration_closes,
  bracketGenerated: r.bracket_generated,
});

interface PairRow {
  id: string;
  tournament_id: string;
  category: Category;
  player1_name: string;
  player2_name: string;
  player1_key: string;
  player2_key: string;
  seed: number | null;
  created_at: string;
}

const toPair = (r: PairRow): Pair => ({
  id: r.id,
  tournamentId: r.tournament_id,
  category: r.category,
  player1Name: r.player1_name,
  player2Name: r.player2_name,
  player1Key: r.player1_key,
  player2Key: r.player2_key,
  seed: r.seed,
  createdAt: r.created_at,
});

interface RegistrationRow extends PairRow {
  user_id: string;
  player1_email: string;
  player2_email: string;
  status: Registration["status"];
}

const toRegistration = (r: RegistrationRow): Registration => ({
  ...toPair(r),
  userId: r.user_id,
  player1Email: r.player1_email,
  player2Email: r.player2_email,
  status: r.status,
});

interface ResultRow {
  tournament_id: string;
  category: Category;
  round: number;
  position: number;
  winner: "a" | "b";
  score: string;
}

const toResult = (r: ResultRow): MatchResult => ({
  tournamentId: r.tournament_id,
  category: r.category,
  round: r.round,
  position: r.position,
  winner: r.winner,
  score: r.score,
});

type TournamentMethods = Pick<
  Backend,
  | "listTournaments"
  | "getTournament"
  | "createTournament"
  | "listPairs"
  | "listUserRegistrations"
  | "listTournamentRegistrations"
  | "getRegistration"
  | "insertRegistration"
  | "cancelRegistration"
  | "generateBracket"
  | "listResults"
  | "setResult"
>;

export const supabaseTournaments: TournamentMethods = {
  async listTournaments() {
    const supabase = await client();
    const { data, error } = await supabase.from("tournaments").select().order("date");
    if (error) throw error;
    return data.map(toTournament);
  },

  async getTournament(id) {
    const supabase = await client();
    const { data } = await supabase.from("tournaments").select().eq("id", id).maybeSingle();
    return data ? toTournament(data) : null;
  },

  async createTournament(t) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name: t.name,
        date: t.date,
        start_slot: t.startSlot,
        end_slot: t.endSlot,
        categories: t.categories,
        max_pairs: t.maxPairs,
        price_per_pair: t.pricePerPair,
        registration_closes: t.registrationCloses,
      })
      .select()
      .single();
    if (error) throw error;
    return toTournament(data);
  },

  async listPairs(tournamentId) {
    const supabase = await client();
    const { data, error } = await supabase.rpc("tournament_pairs", { p_tournament: tournamentId ?? null });
    if (error) throw error;
    return (data ?? []).map(toPair);
  },

  async listUserRegistrations(userId, email) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("tournament_registrations")
      .select()
      .or(`user_id.eq.${userId},player2_email.eq."${email.toLowerCase()}"`);
    if (error) throw error;
    return data.map(toRegistration);
  },

  async listTournamentRegistrations(tournamentId) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("tournament_registrations")
      .select()
      .eq("tournament_id", tournamentId)
      .order("created_at");
    if (error) throw error;
    return data.map(toRegistration);
  },

  async getRegistration(id) {
    const supabase = await client();
    const { data } = await supabase.from("tournament_registrations").select().eq("id", id).maybeSingle();
    return data ? toRegistration(data) : null;
  },

  async insertRegistration(r) {
    const supabase = await client();
    const { error } = await supabase.from("tournament_registrations").insert({
      tournament_id: r.tournamentId,
      category: r.category,
      user_id: r.userId,
      player1_name: r.player1Name,
      player1_email: r.player1Email.toLowerCase(),
      player2_name: r.player2Name,
      player2_email: r.player2Email.toLowerCase(),
    });
    // 23505: índice único de jugador por categoría. P0001: trigger de cupo.
    if (error?.code === "23505") return { ok: false, error: "duplicate" };
    if (error?.code === "P0001") return { ok: false, error: "full" };
    if (error) throw error;
    return { ok: true };
  },

  async cancelRegistration(id) {
    const supabase = await client();
    const { error } = await supabase.from("tournament_registrations").update({ status: "cancelled" }).eq("id", id);
    if (error) throw error;
  },

  async generateBracket(tournamentId, seeds) {
    const supabase = await client();
    const { error } = await supabase.rpc("generate_bracket", {
      p_tournament: tournamentId,
      p_seeds: seeds.map((s) => ({ id: s.id, seed: s.seed })),
    });
    if (error) throw error;
  },

  async listResults(tournamentId) {
    const supabase = await client();
    let query = supabase.from("tournament_results").select();
    if (tournamentId) query = query.eq("tournament_id", tournamentId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(toResult);
  },

  async setResult(r) {
    const supabase = await client();
    const { error } = await supabase.from("tournament_results").upsert({
      tournament_id: r.tournamentId,
      category: r.category,
      round: r.round,
      position: r.position,
      winner: r.winner,
      score: r.score,
    });
    if (error) throw error;
  },
};
