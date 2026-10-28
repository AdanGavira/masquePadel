"use client";

import { useActionState } from "react";
import { adminAcademyAction, type AdminAcademyState } from "@/app/actions";
import { LEVELS, type Level } from "@/lib/academy";
import type { AcademyStatus } from "@/lib/data/types";
import type { Dictionary } from "@/lib/i18n";
import { Alert, Button } from "./ui";

const select =
  "mt-1 block w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20";

export function AdminRequestForm({
  id,
  status,
  assessedLevel,
  groupId,
  groupOptions,
  dict,
}: {
  id: string;
  status: AcademyStatus;
  assessedLevel: Level | null;
  groupId: string | null;
  groupOptions: { value: string; label: string }[];
  dict: Dictionary["academy"];
}) {
  const [state, action, pending] = useActionState<AdminAcademyState, FormData>(adminAcademyAction, undefined);
  const statuses = Object.keys(dict.status) as AcademyStatus[];

  return (
    <form action={action} className="space-y-3 rounded-2xl bg-bg-soft p-4">
      <input type="hidden" name="id" value={id} />
      <label className="block text-xs font-semibold text-fg-muted">
        {dict.admin.level}
        <select name="assessedLevel" defaultValue={assessedLevel ?? ""} className={select}>
          <option value="">{dict.admin.noLevel}</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {dict.levels[level]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-fg-muted">
        {dict.admin.group}
        <select name="groupId" defaultValue={groupId ?? ""} className={select}>
          <option value="">{dict.admin.noGroup}</option>
          {groupOptions.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-fg-muted">
        {dict.admin.status}
        <select name="status" defaultValue={status} className={select}>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {dict.status[s]}
            </option>
          ))}
        </select>
      </label>
      {state && !state.ok && <Alert>{dict.admin.errors[state.error]}</Alert>}
      {state?.ok && <Alert tone="success">{dict.admin.saved}</Alert>}
      <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
        {dict.admin.save}
      </Button>
    </form>
  );
}
