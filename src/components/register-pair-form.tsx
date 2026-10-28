"use client";

import { useEffect, useRef } from "react";
import { registerPairAction, type RegisterPairState } from "@/app/actions";
import type { Dictionary } from "@/lib/i18n";
import type { Category } from "@/lib/tournaments";
import { Alert, Button } from "./ui";
import { useFormAction } from "./use-form-action";

const input =
  "mt-1.5 block w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-fg outline-none transition-colors focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20";

export function RegisterPairForm({
  tournamentId,
  userName,
  categories,
  initialCategory,
  dict,
}: {
  tournamentId: string;
  userName: string;
  categories: { value: Category; full: boolean }[];
  initialCategory: Category;
  dict: Dictionary;
}) {
  const r = dict.tournaments.register;
  const [state, onSubmit, pending] = useFormAction<RegisterPairState>(registerPairAction);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  const available = categories.filter((c) => !c.full);
  if (categories.length === 0) return state?.ok ? <div className="mt-4"><Alert tone="success">{r.success}</Alert></div> : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      {state?.ok && <Alert tone="success">{r.success}</Alert>}
      {state && !state.ok && <Alert>{r.errors[state.error]}</Alert>}
      <label className="block text-sm font-medium">
        {r.category}
        <select
          name="category"
          defaultValue={available.some((c) => c.value === initialCategory) ? initialCategory : available[0]?.value}
          className={input}
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value} disabled={c.full}>
              {dict.tournaments.categories[c.value]}
              {c.full ? ` · ${r.full}` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="text-sm">
        <span className="font-medium">{r.you}</span>
        <p className="mt-1.5 rounded-xl bg-bg-soft px-4 py-2.5">{userName}</p>
      </div>
      <label className="block text-sm font-medium">
        {r.partnerName}
        <input name="partnerName" required maxLength={80} className={input} />
      </label>
      <label className="block text-sm font-medium">
        {r.partnerEmail}
        <input name="partnerEmail" type="email" required maxLength={120} className={input} />
        <span className="mt-1 block text-xs font-normal text-fg-muted">{r.partnerHint}</span>
      </label>
      <Button type="submit" className="w-full" disabled={pending || available.length === 0}>
        {pending ? r.sending : r.submit}
      </Button>
    </form>
  );
}
