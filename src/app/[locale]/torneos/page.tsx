import { ArrowRight, CalendarDays, Clock, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/tournament-ui";
import { ButtonLink, Card, Container, SectionHeading } from "@/components/ui";
import { euros } from "@/lib/academy-format";
import { formatDate, getDictionary, href, isLocale, t, type Dictionary, type Locale } from "@/lib/i18n";
import { slotEnd } from "@/lib/slots";
import { statusOf } from "@/lib/tournament-format";
import { loadWorld } from "@/lib/tournament-service";
import { CATEGORIES, buildBracket, computeRanking, type Pair, type MatchResult, type Tournament } from "@/lib/tournaments";
import { todayKey } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.tournaments.title, description: dict.tournaments.subtitle };
}

export default async function TournamentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const tt = dict.tournaments;
  const { tournaments, pairs, results } = await loadWorld();
  const today = todayKey();
  const upcoming = tournaments.filter((x) => x.date >= today);
  const past = tournaments.filter((x) => x.date < today).reverse();

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{tt.title}</h1>
        <p className="mt-3 text-lg text-fg-muted">{tt.subtitle}</p>
      </header>

      <section>
        <SectionHeading title={tt.upcoming} />
        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-fg-muted">{tt.none}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {upcoming.map((x) => (
              <TournamentCard key={x.id} tournament={x} pairs={pairs} results={results} locale={locale} dict={dict} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading title={tt.ranking.title} subtitle={tt.ranking.subtitle} />
          <ButtonLink href={href(locale, "/torneos/ranking")} variant="ghost" className="mb-10">
            {tt.ranking.cta} <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {CATEGORIES.map((c) => {
            const top = computeRanking(c, tournaments, pairs, results).slice(0, 5);
            return (
              <Card key={c} className="p-0">
                <h3 className="border-b border-line px-5 py-3 font-display font-bold">{tt.categories[c]}</h3>
                {top.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-fg-muted">{tt.ranking.empty}</p>
                ) : (
                  <ol className="divide-y divide-line">
                    {top.map((row, i) => (
                      <li key={row.key} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        <span className="w-5 font-display font-extrabold text-fg-muted">{i + 1}</span>
                        <span className="flex-1 truncate font-medium">{row.name}</span>
                        <span className="font-semibold tabular-nums">{row.points}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {past.length > 0 && (
        <section className="mt-16">
          <SectionHeading title={tt.past} />
          <div className="grid gap-5 md:grid-cols-2">
            {past.map((x) => (
              <TournamentCard key={x.id} tournament={x} pairs={pairs} results={results} locale={locale} dict={dict} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

function TournamentCard({
  tournament: x,
  pairs,
  results,
  locale,
  dict,
}: {
  tournament: Tournament;
  pairs: Pair[];
  results: MatchResult[];
  locale: Locale;
  dict: Dictionary;
}) {
  const tt = dict.tournaments;
  const own = pairs.filter((p) => p.tournamentId === x.id);
  const brackets = x.categories.map((c) =>
    buildBracket(
      own.filter((p) => p.category === c),
      results.filter((r) => r.tournamentId === x.id && r.category === c),
    ),
  );
  const status = statusOf(x, brackets);
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold">{x.name}</h3>
        <StatusBadge status={status} dict={dict} />
      </div>
      <ul className="mt-4 space-y-2 text-sm text-fg-muted">
        <li className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          <span className="first-letter:uppercase">{formatDate(locale, x.date, { weekday: "long", month: "long" })}</span>
        </li>
        <li className="flex items-center gap-2">
          <Clock className="size-4" /> {t(tt.courts, { start: x.startSlot, end: slotEnd(x.endSlot) })}
        </li>
        <li className="flex items-center gap-2">
          <Users className="size-4" />
          {x.categories
            .map((c) => `${tt.categories[c]} ${own.filter((p) => p.category === c).length}/${x.maxPairs}`)
            .join(" · ")}
        </li>
      </ul>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">{t(tt.pricePair, { price: euros(locale, x.pricePerPair) })}</p>
        <Link
          href={href(locale, `/torneos/${x.id}`)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:underline dark:text-ball-400"
        >
          {status === "open" ? tt.view : tt.results} <ArrowRight className="size-4" />
        </Link>
      </div>
      {status === "open" && (
        <p className="mt-2 text-xs text-fg-muted">{t(tt.closesOn, { date: formatDate(locale, x.registrationCloses) })}</p>
      )}
    </Card>
  );
}
