import Link from "next/link";
import { formatDate, href, type Locale } from "@/lib/i18n";
import { bookableDates } from "@/lib/slots";
import { cx } from "./ui";

export function DateStrip({
  locale,
  path,
  selected,
  todayLabel,
}: {
  locale: Locale;
  path: string;
  selected: string;
  todayLabel: string;
}) {
  const dates = bookableDates();
  return (
    <nav aria-label="Fechas" className="-mx-4 mb-8 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        {dates.map((d, i) => {
          const active = d === selected;
          const [weekday] = formatDate(locale, d, { weekday: "short", day: undefined, month: undefined }).split(" ");
          return (
            <li key={d}>
              <Link
                href={`${href(locale, path)}?date=${d}`}
                scroll={false}
                aria-current={active ? "date" : undefined}
                className={cx(
                  "flex w-16 flex-col items-center rounded-2xl border px-2 py-3 transition-colors",
                  active
                    ? "border-navy-700 bg-navy-700 text-white dark:border-ball-500 dark:bg-ball-500 dark:text-navy-950"
                    : "border-line bg-card hover:border-navy-300",
                )}
              >
                <span className="text-xs font-medium uppercase opacity-80">{i === 0 ? todayLabel : weekday.replace(".", "")}</span>
                <span className="font-display text-xl font-bold">{Number(d.slice(8))}</span>
                <span className="text-[11px] opacity-70">
                  {formatDate(locale, d, { weekday: undefined, day: undefined, month: "short" }).replace(".", "")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
