"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { academyRequestAction, type AcademyFormState } from "@/app/actions";
import { MAX_NOTES } from "@/lib/academy";
import type { Dictionary, Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Alert, Button, Card, cx } from "./ui";
import { useFormAction } from "./use-form-action";

const input =
  "mt-1.5 block w-full rounded-xl border border-line bg-bg px-4 py-3 text-fg outline-none transition-colors focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20";
const label = "block text-sm font-medium";
const choice =
  "flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-bg px-4 py-3 text-sm transition-colors has-[:checked]:border-navy-500 has-[:checked]:bg-navy-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ball-500 dark:has-[:checked]:bg-navy-900/60";

/** Lunes primero, domingo al final. */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function AcademyForm({
  locale,
  dict,
  weekdays,
  court,
  user,
  loginHref,
  myBookingsHref,
  myBookingsLabel,
  tests,
}: {
  locale: Locale;
  dict: Dictionary["academy"]["form"];
  weekdays: string[];
  court: number;
  user: { name: string; email: string } | null;
  loginHref: string;
  myBookingsHref: string;
  myBookingsLabel: string;
  tests: { value: string; label: string; free: number }[];
}) {
  const [state, onSubmit, pending] = useFormAction<AcademyFormState>(academyRequestAction);
  const [forWhom, setForWhom] = useState<"adult" | "child">("adult");
  const [formKey, setFormKey] = useState(0);
  const [dismissed, setDismissed] = useState<AcademyFormState>(undefined);

  if (state?.ok && state !== dismissed) {
    const test = tests.find((x) => x.value === `${state.testDate} ${state.testSlot}`);
    return (
      <Card className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
        <h3 className="mt-4 font-display text-2xl font-extrabold">{dict.successTitle}</h3>
        <p className="mx-auto mt-3 max-w-lg text-fg-muted">
          {test
            ? t(dict.successTest, { date: test.label.split(" · ")[0], time: state.testSlot ?? "", court })
            : dict.successCall}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {user && (
            <Link href={myBookingsHref} className="rounded-full bg-ball-500 px-5 py-2.5 text-sm font-semibold text-navy-950">
              {myBookingsLabel}
            </Link>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setDismissed(state);
              setFormKey((k) => k + 1);
            }}
          >
            {dict.another}
          </Button>
        </div>
      </Card>
    );
  }

  const error = state && !state.ok && state !== dismissed ? dict.errors[state.error] : null;

  return (
    <Card>
      <form key={formKey} onSubmit={onSubmit} className="space-y-6">
        <input type="hidden" name="locale" value={locale} />
        {error && <Alert>{error}</Alert>}
        <Alert tone="info">
          {user ? (
            dict.loggedAs
          ) : (
            <>
              {dict.guest}{" "}
              <Link href={loginHref} className="font-semibold underline underline-offset-2">
                {dict.guestCta}
              </Link>
            </>
          )}
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={cx(label, "sm:col-span-2")}>
            {dict.name}
            <input name="name" required maxLength={80} autoComplete="name" defaultValue={user?.name} className={input} />
          </label>
          <label className={label}>
            {dict.email}
            <input name="email" type="email" required maxLength={120} autoComplete="email" defaultValue={user?.email} className={input} />
          </label>
          <label className={label}>
            {dict.phone}
            <input name="phone" type="tel" required minLength={6} maxLength={30} autoComplete="tel" className={input} />
          </label>
        </div>

        <fieldset>
          <legend className={label}>{dict.forWhom}</legend>
          <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
            {(["adult", "child"] as const).map((value) => (
              <label key={value} className={choice}>
                <input
                  type="radio"
                  name="forWhom"
                  value={value}
                  checked={forWhom === value}
                  onChange={() => setForWhom(value)}
                  className="accent-navy-600"
                />
                {value === "adult" ? dict.adult : dict.child}
              </label>
            ))}
          </div>
          {forWhom === "child" && (
            <label className={cx(label, "mt-4 max-w-32")}>
              {dict.childAge}
              <input name="childAge" type="number" required min={4} max={17} className={input} />
            </label>
          )}
        </fieldset>

        <fieldset>
          <legend className={label}>{dict.experience}</legend>
          <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
            {(Object.keys(dict.experiences) as (keyof typeof dict.experiences)[]).map((value, i) => (
              <label key={value} className={choice}>
                <input type="radio" name="experience" value={value} required defaultChecked={i === 0} className="accent-navy-600" />
                {dict.experiences[value]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset>
            <legend className={label}>{dict.days}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DAY_ORDER.map((d) => (
                <label key={d} className={cx(choice, "px-3 py-2 capitalize")}>
                  <input type="checkbox" name="preferredDays" value={d} className="sr-only" />
                  {weekdays[d]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>{dict.time}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(Object.keys(dict.times) as (keyof typeof dict.times)[]).map((value) => (
                <label key={value} className={cx(choice, "px-3 py-2")}>
                  <input type="radio" name="preferredTime" value={value} className="sr-only" />
                  {dict.times[value]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <fieldset>
          <legend className={label}>{dict.levelTest}</legend>
          <p className="mt-1 text-xs text-fg-muted">{t(dict.levelTestHint, { court })}</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {tests.map((test, i) => (
              <label key={test.value} className={cx(choice, "justify-between")}>
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="levelTest"
                    value={test.value}
                    disabled={test.free === 0}
                    defaultChecked={i === tests.findIndex((x) => x.free > 0)}
                    className="accent-navy-600"
                  />
                  <span className="first-letter:uppercase">{test.label}</span>
                </span>
                <span className="shrink-0 text-xs text-fg-muted">
                  {test.free === 0 ? dict.full : t(dict.spots, { n: test.free })}
                </span>
              </label>
            ))}
            <label className={cx(choice, "sm:col-span-2")}>
              <input type="radio" name="levelTest" value="" defaultChecked={!tests.some((x) => x.free > 0)} className="accent-navy-600" />
              {dict.noTest}
            </label>
          </div>
        </fieldset>

        <label className={label}>
          {dict.notes}
          <textarea name="notes" rows={3} maxLength={MAX_NOTES} className={input} />
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-navy-600" />
          <span className="text-fg-muted">{dict.consent}</span>
        </label>

        <Button type="submit" className="w-full py-3 text-base" disabled={pending}>
          {pending ? dict.sending : dict.submit}
        </Button>
      </form>
    </Card>
  );
}
