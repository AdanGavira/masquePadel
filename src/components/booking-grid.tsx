"use client";

import { CalendarCheck, Check, Clock, GraduationCap, Lock, LogIn, Minus, Plus, Trophy, Wallet, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { bookAction } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Alert, Button, ButtonLink, cx } from "./ui";

export type CellState = "free" | "booked" | "mine" | "blocked" | "class" | "tournament" | "past";

interface Row {
  slot: string;
  end: string;
  cells: { courtId: number; state: CellState }[];
}

const cellStyles: Record<CellState, string> = {
  free: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:border-emerald-500",
  booked: "border-line bg-bg-soft text-fg-muted",
  mine: "border-ball-500 bg-ball-400/25 text-navy-900 dark:text-ball-300",
  blocked: "border-line bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--border)_6px,var(--border)_8px)] text-fg-muted",
  tournament: "border-ball-500/40 bg-ball-400/10 text-ball-600 dark:text-ball-400",
  class: "border-navy-200 bg-navy-50 text-navy-700 dark:border-navy-800 dark:bg-navy-900/50 dark:text-navy-200",
  past: "border-transparent bg-transparent text-fg-muted/60",
};

export function BookingGrid({
  locale,
  date,
  dateLabel,
  courts,
  rows,
  loggedIn,
  loginHref,
  dict,
  maxActive,
  price,
  pricePerPlayer,
  myBookingsLabel,
}: {
  locale: Locale;
  date: string;
  dateLabel: string;
  courts: number[];
  rows: Row[];
  loggedIn: boolean;
  loginHref: string;
  dict: Dictionary["booking"];
  maxActive: number;
  price: number;
  pricePerPlayer: number;
  myBookingsLabel: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<{ courtId: number; slot: string; end: string } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const confirm = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await bookAction({ courtId: selected.courtId, date, slot: selected.slot });
      if (result.ok) {
        setMessage({
          tone: "success",
          text: t(dict.success, { court: selected.courtId, date: dateLabel, time: selected.slot }),
        });
      } else {
        setMessage({ tone: "error", text: t(dict.errors[result.error], { max: maxActive }) });
      }
      setSelected(null);
      router.refresh();
    });
  };

  const fmt = (n: number) => (locale === "es" ? `${n} €` : `€${n}`);
  const legend: CellState[] = ["free", "booked", "mine", "class", "tournament", "blocked"];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="font-display text-lg font-bold first-letter:uppercase">{dateLabel}</p>
        <ul className="flex flex-wrap gap-4 text-sm text-fg-muted">
          {legend.map((state) => (
            <li key={state} className="flex items-center gap-2">
              <span className={cx("size-4 rounded border", cellStyles[state])} />
              {dict.legend[state]}
            </li>
          ))}
        </ul>
      </div>

      {message && (
        <div className="mb-6">
          <Alert tone={message.tone}>
            <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              {message.text}
              {message.tone === "success" && (
                <Link
                  href={`/${locale}/mis-reservas`}
                  className="inline-flex shrink-0 items-center gap-1.5 font-semibold underline underline-offset-2"
                >
                  <CalendarCheck className="size-4" /> {myBookingsLabel}
                </Link>
              )}
            </span>
          </Alert>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <table className="w-full table-fixed border-separate border-spacing-1.5 sm:border-spacing-2">
          <caption className="sr-only">{dateLabel}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-16 sm:w-28">
                <Clock className="mx-auto size-4 text-fg-muted" aria-hidden />
              </th>
              {courts.map((id) => (
                <th key={id} scope="col" className="pb-1 pt-2 font-display text-sm font-bold sm:text-base">
                  {t(dict.court, { n: id })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slot}>
                <th scope="row" className="text-left text-xs font-semibold tabular-nums sm:pl-3 sm:text-sm">
                  {row.slot}
                  <span className="hidden text-fg-muted sm:inline"> – {row.end}</span>
                </th>
                {row.cells.map((cell) => {
                  const label = `${t(dict.court, { n: cell.courtId })}, ${row.slot}–${row.end}: ${dict.legend[cell.state]}`;
                  const content = (
                    <>
                      {cell.state === "free" && <Plus className="size-4 sm:hidden" />}
                      {cell.state === "booked" && <Minus className="size-4 opacity-50 sm:hidden" />}
                      {cell.state === "mine" && <Check className="size-4" />}
                      {cell.state === "blocked" && <Lock className="size-3.5" />}
                      {cell.state === "class" && <GraduationCap className="size-4" />}
                      {cell.state === "tournament" && <Trophy className="size-4" />}
                      <span className="hidden sm:inline">{dict.legend[cell.state]}</span>
                    </>
                  );
                  const classes = cx(
                    "flex h-12 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors sm:text-sm",
                    cellStyles[cell.state],
                  );
                  return (
                    <td key={cell.courtId}>
                      {cell.state === "free" ? (
                        <button
                          type="button"
                          aria-label={label}
                          className={classes}
                          onClick={() => {
                            setMessage(null);
                            setSelected({ courtId: cell.courtId, slot: row.slot, end: row.end });
                          }}
                        >
                          {content}
                        </button>
                      ) : (
                        <div aria-label={label} role="img" className={classes}>
                          {content}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-fg-muted">{dict.selectHint}</p>

      <dialog
        ref={dialogRef}
        onClose={() => setSelected(null)}
        className="m-auto w-[min(92vw,28rem)] rounded-3xl border border-line bg-card p-0 text-fg shadow-2xl backdrop:bg-navy-950/60 backdrop:backdrop-blur-sm"
      >
        {selected && (
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl font-extrabold">
                {loggedIn ? dict.confirmTitle : dict.loginRequired}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={dict.cancel}
                className="rounded-full p-1 text-fg-muted hover:bg-bg-soft"
              >
                <X className="size-5" />
              </button>
            </div>

            <dl className="mt-6 space-y-3 rounded-2xl bg-bg-soft p-5">
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">{t(dict.court, { n: selected.courtId })}</dt>
                <dd className="text-right font-semibold first-letter:uppercase">{dateLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">
                  <Clock className="inline size-4" />
                </dt>
                <dd className="font-semibold tabular-nums">
                  {selected.slot} – {selected.end}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-3">
                <dt className="text-fg-muted">
                  <Wallet className="inline size-4" />
                </dt>
                <dd className="font-semibold">{t(dict.confirmPrice, { price, perPlayer: pricePerPlayer })}</dd>
              </div>
            </dl>

            {loggedIn ? (
              <>
                <p className="mt-4 text-sm text-fg-muted">{dict.payAtClub}</p>
                <div className="mt-6 flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setSelected(null)} disabled={pending}>
                    {dict.cancel}
                  </Button>
                  <Button className="flex-1" onClick={confirm} disabled={pending} autoFocus>
                    {pending ? dict.booking : `${dict.confirm} · ${fmt(price)}`}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-fg-muted">{dict.loginRequiredText}</p>
                <ButtonLink href={loginHref} className="mt-6 w-full">
                  <LogIn className="size-4" /> {dict.loginRequired}
                </ButtonLink>
              </>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
