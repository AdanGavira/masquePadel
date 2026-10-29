import { Trophy } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { roundName, type TournamentStatus } from "@/lib/tournament-format";
import { CATEGORIES, champion, type Category, type Match, type Pair } from "@/lib/tournaments";
import { cx } from "./ui";

const statusStyles: Record<TournamentStatus, string> = {
  open: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  closed: "bg-bg-soft text-fg-muted",
  inPlay: "bg-ball-400/25 text-ball-600 dark:text-ball-300",
  finished: "bg-navy-50 text-navy-700 dark:bg-navy-900 dark:text-navy-100",
};

export function StatusBadge({ status, dict }: { status: TournamentStatus; dict: Dictionary }) {
  return (
    <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyles[status])}>
      {dict.tournaments.status[status]}
    </span>
  );
}

export function CategoryTabs({
  categories = CATEGORIES,
  active,
  hrefFor,
  dict,
}: {
  categories?: Category[];
  active: Category;
  hrefFor: (c: Category) => string;
  dict: Dictionary;
}) {
  return (
    <nav aria-label={dict.tournaments.register.category} className="mb-6 flex flex-wrap gap-2">
      {categories.map((c) => (
        <Link
          key={c}
          href={hrefFor(c)}
          scroll={false}
          aria-current={c === active ? "page" : undefined}
          className={cx(
            "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
            c === active
              ? "border-navy-700 bg-navy-700 text-white dark:border-ball-500 dark:bg-ball-500 dark:text-navy-950"
              : "border-line text-fg-muted hover:text-fg",
          )}
        >
          {dict.tournaments.categories[c]}
        </Link>
      ))}
    </nav>
  );
}

export const pairLabel = (p: Pair) => `${p.player1Name} / ${p.player2Name}`;

function Side({ pair, won, empty }: { pair: Pair | null; won: boolean; empty: string }) {
  return (
    <div className={cx("flex items-center gap-2 px-3 py-2", won ? "font-bold" : pair ? "" : "italic text-fg-muted")}>
      {pair?.seed && pair.seed <= 4 && (
        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-bg-soft text-[10px] font-bold text-fg-muted">
          {pair.seed}
        </span>
      )}
      <span className="truncate" title={pair ? pairLabel(pair) : undefined}>
        {pair ? pairLabel(pair) : empty}
      </span>
      {won && <Trophy className="ml-auto size-3.5 shrink-0 text-ball-500" aria-hidden />}
    </div>
  );
}

export function MatchCard({ match, dict }: { match: Match; dict: Dictionary }) {
  const d = dict.tournaments.detail;
  const emptyLabel = match.round === 0 ? d.bye : d.tbd;
  return (
    <div className="w-60 overflow-hidden rounded-xl border border-line bg-card text-sm shadow-sm">
      <Side pair={match.a} won={!!match.winner && match.winner === match.a} empty={emptyLabel} />
      <div className="border-t border-line" />
      <Side pair={match.b} won={!!match.winner && match.winner === match.b} empty={emptyLabel} />
      {match.score && (
        <div className="border-t border-line bg-bg-soft px-3 py-1 text-xs tabular-nums text-fg-muted">{match.score}</div>
      )}
    </div>
  );
}

/** Cuadro en columnas por ronda, con scroll horizontal en móvil. */
export function BracketView({
  bracket,
  dict,
  renderMatch,
}: {
  bracket: Match[][];
  dict: Dictionary;
  renderMatch?: (m: Match) => React.ReactNode;
}) {
  const winner = champion(bracket);
  return (
    <div>
      {winner && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl bg-ball-500 px-5 py-4 text-navy-950">
          <Trophy className="size-8 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">{dict.tournaments.detail.champion}</p>
            <p className="font-display text-xl font-extrabold">{pairLabel(winner)}</p>
          </div>
        </div>
      )}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        <div className="flex gap-6">
          {bracket.map((round, i) => (
            <div key={i} className="flex shrink-0 flex-col">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-fg-muted">
                {roundName(dict, i, bracket.length)}
              </h3>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {round.map((m) => (
                  <div key={m.position}>{renderMatch ? renderMatch(m) : <MatchCard match={m} dict={dict} />}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
