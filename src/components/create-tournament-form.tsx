"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createTournamentAction, type CreateTournamentState } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { CATEGORIES, PAIR_SIZES } from "@/lib/tournaments";
import { Alert, Button } from "./ui";
import { useFormAction } from "./use-form-action";

const input =
  "mt-1.5 block w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20";
const label = "block text-sm font-medium";

export function CreateTournamentForm({
  dict,
  slots,
  defaultDate,
  locale,
}: {
  dict: Dictionary;
  slots: string[];
  defaultDate: string;
  locale: Locale;
}) {
  const a = dict.tournaments.admin;
  const router = useRouter();
  const [state, onSubmit, pending] = useFormAction<CreateTournamentState>(createTournamentAction);

  useEffect(() => {
    if (state?.ok) router.push(`/${locale}/admin/torneos/${state.id}`);
  }, [state, router, locale]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {state && !state.ok && <Alert>{a.errors[state.error]}</Alert>}
      <label className={label}>
        {a.name}
        <input name="name" required minLength={3} maxLength={80} className={input} />
      </label>
      <label className={label}>
        {a.date}
        <input name="date" type="date" required defaultValue={defaultDate} min={defaultDate} className={input} />
        <span className="mt-1 block text-xs font-normal text-fg-muted">{a.dateHint}</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          {a.startSlot}
          <select name="startSlot" defaultValue="09:30" className={input}>
            {slots.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          {a.endSlot}
          <select name="endSlot" defaultValue="20:00" className={input}>
            {slots.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend className={label}>{a.categories}</legend>
        <div className="mt-1.5 flex flex-wrap gap-3">
          {CATEGORIES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="categories" value={c} defaultChecked className="size-4 accent-navy-600" />
              {dict.tournaments.categories[c]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          {a.maxPairs}
          <select name="maxPairs" defaultValue="16" className={input}>
            {PAIR_SIZES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          {a.price}
          <input name="pricePerPair" type="number" min={0} max={500} defaultValue={30} required className={input} />
        </label>
      </div>
      <label className={label}>
        {a.closes}
        <select name="closesDaysBefore" defaultValue="3" className={input}>
          {[1, 2, 3, 5, 7].map((n) => (
            <option key={n} value={n}>
              {t(a.closesDays, { n })}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {a.submit}
      </Button>
    </form>
  );
}
