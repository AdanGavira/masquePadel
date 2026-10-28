import "server-only";
import { GROUPS, LEVEL_TEST, LEVELS, MAX_NOTES, getGroup, upcomingLevelTests, type Level } from "./academy";
import { backend, type AcademyRequest, type AcademyStatus, type Experience, type PreferredTime, type User } from "./data";

/** Reglas de la academia, comunes a cualquier backend. */

export type AcademyFormError = "fields" | "consent" | "testFull";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXPERIENCES: Experience[] = ["never", "beginner", "intermediate", "advanced"];
const TIMES: PreferredTime[] = ["morning", "afternoon", "evening"];
const STATUSES: AcademyStatus[] = ["pending", "assigned", "waitlist", "cancelled"];

export async function levelTestAvailability() {
  const counts = await backend.levelTestCounts();
  return upcomingLevelTests().map((t) => {
    const taken = counts.find((c) => c.date === t.date && c.slot === t.slot)?.count ?? 0;
    return { ...t, free: Math.max(0, LEVEL_TEST.capacity - taken) };
  });
}

export async function submitAcademyRequest(
  user: User | null,
  form: FormData,
): Promise<{ ok: true; testDate: string | null; testSlot: string | null } | { ok: false; error: AcademyFormError }> {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const name = text("name");
  const email = text("email").toLowerCase();
  const phone = text("phone");
  const forWhom = text("forWhom") === "child" ? "child" : "adult";
  const childAge = forWhom === "child" ? Number(text("childAge")) : null;
  const experience = text("experience") as Experience;
  const preferredTime = (TIMES as string[]).includes(text("preferredTime")) ? (text("preferredTime") as PreferredTime) : null;
  const preferredDays = form
    .getAll("preferredDays")
    .map(Number)
    .filter((d, i, all) => Number.isInteger(d) && d >= 0 && d <= 6 && all.indexOf(d) === i);
  const notes = text("notes").slice(0, MAX_NOTES);
  const [testDate, testSlot] = text("levelTest") ? text("levelTest").split(" ") : [null, null];

  if (
    !name ||
    name.length > 80 ||
    !EMAIL.test(email) ||
    email.length > 120 ||
    phone.replace(/\D/g, "").length < 6 ||
    phone.length > 30 ||
    !EXPERIENCES.includes(experience) ||
    (childAge !== null && !(Number.isInteger(childAge) && childAge >= 4 && childAge <= 17))
  ) {
    return { ok: false, error: "fields" };
  }
  if (form.get("consent") !== "on") return { ok: false, error: "consent" };

  if (testDate) {
    const session = (await levelTestAvailability()).find((t) => t.date === testDate && t.slot === testSlot);
    if (!session) return { ok: false, error: "fields" };
    if (session.free === 0) return { ok: false, error: "testFull" };
  }

  await backend.insertAcademyRequest({
    userId: user?.id ?? null,
    name,
    email,
    phone,
    forWhom,
    childAge,
    experience,
    preferredDays,
    preferredTime,
    testDate: testDate ?? null,
    testSlot: testSlot ?? null,
    notes,
  });
  return { ok: true, testDate: testDate ?? null, testSlot: testSlot ?? null };
}

export type AdminAcademyError = "forbidden" | "notFound" | "invalid" | "groupFull";

export async function adminUpdateRequest(
  user: User | null,
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: AdminAcademyError }> {
  if (user?.role !== "admin") return { ok: false, error: "forbidden" };
  const request = await backend.getAcademyRequest(String(form.get("id")));
  if (!request) return { ok: false, error: "notFound" };

  const status = String(form.get("status")) as AcademyStatus;
  const levelValue = String(form.get("assessedLevel") ?? "");
  const assessedLevel = (LEVELS as string[]).includes(levelValue) ? (levelValue as Level) : null;
  const group = getGroup(String(form.get("groupId") ?? ""));
  if (!STATUSES.includes(status)) return { ok: false, error: "invalid" };
  // Para asignar hace falta un grupo; el resto de estados no conservan grupo.
  if (status === "assigned" && !group) return { ok: false, error: "invalid" };
  const groupId = status === "assigned" ? group!.id : null;

  if (groupId && request.groupId !== groupId) {
    const members = (await backend.groupMemberCounts())[groupId] ?? 0;
    if (members >= group!.capacity) return { ok: false, error: "groupFull" };
  }

  await backend.updateAcademyRequest(request.id, { status, assessedLevel: assessedLevel ?? group?.level ?? null, groupId });
  return { ok: true };
}

export function groupsWithCounts(counts: Record<string, number>) {
  return GROUPS.map((g) => ({ ...g, members: counts[g.id] ?? 0 }));
}

export type { AcademyRequest };
