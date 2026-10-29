import { ArrowLeft, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelRegistrationAction } from "@/app/actions";
import { requireAdminPage } from "@/components/admin-guard";
import { AdminTabs } from "@/components/admin-tabs";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { GenerateBracketForm, MatchResultForm } from "@/components/tournament-admin-forms";
import { BracketView, CategoryTabs, MatchCard, StatusBadge } from "@/components/tournament-ui";
import { Card, Container } from "@/components/ui";
import { backend } from "@/lib/data";
import { formatDate, getDictionary, href, isLocale, t } from "@/lib/i18n";
import { statusOf } from "@/lib/tournament-format";
import { tournamentView } from "@/lib/tournament-service";
import { canSetResult, type Category } from "@/lib/tournaments";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const tournament = await backend.getTournament(id);
  return { title: tournament?.name, robots: { index: false } };
}

export default async function AdminTournamentPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { denied } = await requireAdminPage(locale, `/admin/torneos/${id}`);
  if (denied) return denied;
  const view = await tournamentView(id);
  if (!view) notFound();
  const dict = getDictionary(locale);
  const tt = dict.tournaments;
  const a = tt.admin;
  const { tournament: x, brackets } = view;
  const status = statusOf(x, x.categories.map((c) => brackets[c] ?? []));
  const { cat } = await searchParams;
  const category: Category = x.categories.includes(cat as Category) ? (cat as Category) : x.categories[0];
  const registrations = (await backend.listTournamentRegistrations(x.id)).filter(
    (r) => r.category === category && r.status === "confirmed",
  );
  const bracket = brackets[category] ?? [];
  const pagePath = href(locale, `/admin/torneos/${x.id}`);

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.admin.title}</h1>
      <p className="mb-6 mt-2 text-fg-muted">{tt.subtitle}</p>
      <AdminTabs locale={locale} active="tournaments" dict={dict} />

      <Link href={href(locale, "/admin/torneos")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {a.list}
      </Link>
      <div className="mb-8 mt-3 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-extrabold">{x.name}</h2>
        <StatusBadge status={status} dict={dict} />
        <span className="text-sm text-fg-muted first-letter:uppercase">{formatDate(locale, x.date, { weekday: "long", month: "long" })}</span>
        <Link href={href(locale, `/torneos/${x.id}`)} className="text-sm font-semibold text-navy-600 hover:underline dark:text-ball-400">
          {tt.view}
        </Link>
      </div>

      {!x.bracketGenerated && (
        <Card className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-fg-muted">
            {t(tt.closesOn, { date: formatDate(locale, x.registrationCloses) })}
          </p>
          <GenerateBracketForm tournamentId={x.id} dict={dict} />
        </Card>
      )}

      <CategoryTabs categories={x.categories} active={category} hrefFor={(c) => `${pagePath}?cat=${c}`} dict={dict} />

      {x.bracketGenerated ? (
        <section>
          <h3 className="mb-4 font-display text-xl font-bold">{a.results}</h3>
          {bracket.length === 0 ? (
            <p className="text-fg-muted">{tt.detail.noPairs}</p>
          ) : (
            <BracketView
              bracket={bracket}
              dict={dict}
              renderMatch={(m) => (
                <div className="space-y-2">
                  <MatchCard match={m} dict={dict} />
                  {canSetResult(bracket, m.round, m.position) && (
                    <MatchResultForm
                      key={`${m.round}-${m.position}-${m.score ?? ""}`}
                      tournamentId={x.id}
                      category={category}
                      match={{ round: m.round, position: m.position, a: m.a!.player1Name, b: m.b!.player1Name }}
                      current={m.winner ? { winner: m.winner === m.a ? "a" : "b", score: m.score ?? "" } : null}
                      dict={dict}
                    />
                  )}
                </div>
              )}
            />
          )}
        </section>
      ) : null}

      <section className="mt-10">
        <h3 className="mb-4 font-display text-xl font-bold">
          {a.registrations} <span className="text-fg-muted">({t(tt.pairs, { n: registrations.length, max: x.maxPairs })})</span>
        </h3>
        {registrations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-fg-muted">{tt.detail.noPairs}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <tbody className="divide-y divide-line">
                {registrations
                  .sort((p, q) => (p.seed ?? 99) - (q.seed ?? 99) || p.createdAt.localeCompare(q.createdAt))
                  .map((r, i) => (
                    <tr key={r.id}>
                      <td className="w-10 px-4 py-3 font-display font-extrabold text-fg-muted">{r.seed ?? i + 1}</td>
                      {[
                        [r.player1Name, r.player1Email],
                        [r.player2Name, r.player2Email],
                      ].map(([name, email]) => (
                        <td key={email} className="px-4 py-3">
                          <p className="font-medium">{name}</p>
                          <a href={`mailto:${email}`} className="inline-flex items-center gap-1 text-xs text-fg-muted hover:underline">
                            <Mail className="size-3" /> {email}
                          </a>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        {!x.bracketGenerated && (
                          <form action={cancelRegistrationAction}>
                            <input type="hidden" name="registrationId" value={r.id} />
                            <ConfirmSubmit
                              message={a.confirmCancelReg}
                              className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-fg-muted hover:text-red-600"
                            >
                              {a.cancelReg}
                            </ConfirmSubmit>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Container>
  );
}
