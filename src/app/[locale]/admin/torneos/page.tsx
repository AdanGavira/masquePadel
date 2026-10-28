import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/components/admin-guard";
import { AdminTabs } from "@/components/admin-tabs";
import { CreateTournamentForm } from "@/components/create-tournament-form";
import { StatusBadge } from "@/components/tournament-ui";
import { Card, Container } from "@/components/ui";
import { formatDate, getDictionary, href, isLocale } from "@/lib/i18n";
import { getSlots } from "@/lib/slots";
import { statusOf } from "@/lib/tournament-format";
import { loadWorld } from "@/lib/tournament-service";
import { addDays, todayKey } from "@/lib/time";
import { buildBracket, weekdayOf } from "@/lib/tournaments";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).tournaments.admin.tab, robots: { index: false } } : {};
}

export default async function AdminTournamentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { denied } = await requireAdminPage(locale, "/admin/torneos");
  if (denied) return denied;
  const dict = getDictionary(locale);
  const a = dict.tournaments.admin;
  const { tournaments, pairs, results } = await loadWorld();

  // Primer sábado disponible fuera de la ventana de reservas.
  let firstDate = addDays(todayKey(), 15);
  while (weekdayOf(firstDate) !== 6) firstDate = addDays(firstDate, 1);

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.admin.title}</h1>
      <p className="mb-6 mt-2 text-fg-muted">{dict.tournaments.subtitle}</p>
      <AdminTabs locale={locale} active="tournaments" dict={dict} />

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-4 font-display text-xl font-bold">{a.list}</h2>
          <ul className="space-y-3">
            {[...tournaments].reverse().map((x) => {
              const own = pairs.filter((p) => p.tournamentId === x.id);
              const status = statusOf(
                x,
                x.categories.map((c) =>
                  buildBracket(
                    own.filter((p) => p.category === c),
                    results.filter((r) => r.tournamentId === x.id && r.category === c),
                  ),
                ),
              );
              return (
                <li key={x.id}>
                  <Link
                    href={href(locale, `/admin/torneos/${x.id}`)}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-card p-5 transition-colors hover:border-navy-300"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-lg font-bold">{x.name}</p>
                        <StatusBadge status={status} dict={dict} />
                      </div>
                      <p className="mt-1 text-sm text-fg-muted">
                        <span className="first-letter:uppercase">{formatDate(locale, x.date, { year: "numeric" })}</span> ·{" "}
                        {x.categories
                          .map((c) => `${dict.tournaments.categories[c]} ${own.filter((p) => p.category === c).length}/${x.maxPairs}`)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-navy-600 dark:text-ball-400">
                      {a.manage} <ArrowRight className="size-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="lg:col-span-2">
          <h2 className="mb-4 font-display text-xl font-bold">{a.create}</h2>
          <Card>
            <CreateTournamentForm dict={dict} slots={getSlots()} defaultDate={firstDate} locale={locale} />
          </Card>
        </section>
      </div>
    </Container>
  );
}
