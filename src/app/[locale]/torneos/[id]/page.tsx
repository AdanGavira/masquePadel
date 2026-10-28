import { ArrowLeft, CalendarDays, Clock, LogIn, Trophy, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelRegistrationAction } from "@/app/actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { RegisterPairForm } from "@/components/register-pair-form";
import { BracketView, CategoryTabs, StatusBadge, pairLabel } from "@/components/tournament-ui";
import { ButtonLink, Card, Container, cx } from "@/components/ui";
import { euros } from "@/lib/academy-format";
import { backend } from "@/lib/data";
import { formatDate, getDictionary, href, isLocale, t } from "@/lib/i18n";
import { slotEnd } from "@/lib/slots";
import { statusOf } from "@/lib/tournament-format";
import { tournamentView } from "@/lib/tournament-service";
import type { Category } from "@/lib/tournaments";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const tournament = await backend.getTournament(id);
  return tournament ? { title: tournament.name } : {};
}

export default async function TournamentPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const view = await tournamentView(id);
  if (!view) notFound();
  const dict = getDictionary(locale);
  const tt = dict.tournaments;
  const { tournament: x, pairs, brackets } = view;
  const status = statusOf(x, x.categories.map((c) => brackets[c] ?? []));

  const { cat } = await searchParams;
  const category: Category = x.categories.includes(cat as Category) ? (cat as Category) : x.categories[0];
  const user = await backend.getCurrentUser();
  const mine = user
    ? (await backend.listUserRegistrations(user.id, user.email)).filter(
        (r) => r.tournamentId === x.id && r.status === "confirmed",
      )
    : [];
  const categoryPairs = pairs.filter((p) => p.category === category);
  const pagePath = href(locale, `/torneos/${x.id}`);

  return (
    <Container className="py-10 sm:py-14">
      <Link href={href(locale, "/torneos")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {tt.detail.back}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{x.name}</h1>
        <StatusBadge status={status} dict={dict} />
      </div>

      {/* Con el cuadro publicado, la información va arriba y el cuadro ocupa todo el ancho. */}
      <div className={cx("mt-10 grid gap-10", !x.bracketGenerated && "lg:grid-cols-3")}>
        <aside className={cx("grid gap-5", x.bracketGenerated ? "md:grid-cols-2" : "content-start")}>
          <Card>
            <dl className="space-y-4 text-sm">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 size-4 text-fg-muted" />
                <div>
                  <dt className="text-fg-muted">{tt.detail.date}</dt>
                  <dd className="font-semibold first-letter:uppercase">
                    {formatDate(locale, x.date, { weekday: "long", month: "long", year: "numeric" })}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 size-4 text-fg-muted" />
                <div>
                  <dt className="text-fg-muted">{tt.detail.schedule}</dt>
                  <dd className="font-semibold">{t(tt.courts, { start: x.startSlot, end: slotEnd(x.endSlot) })}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Wallet className="mt-0.5 size-4 text-fg-muted" />
                <div>
                  <dt className="text-fg-muted">{tt.detail.price}</dt>
                  <dd className="font-semibold">{t(tt.pricePair, { price: euros(locale, x.pricePerPair) })}</dd>
                  <dd className="text-xs text-fg-muted">{tt.detail.payAtClub}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Trophy className="mt-0.5 size-4 text-fg-muted" />
                <div>
                  <dt className="text-fg-muted">{tt.detail.format}</dt>
                  <dd>{tt.detail.formatText}</dd>
                </div>
              </div>
            </dl>
          </Card>

          {mine.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-bold">{tt.register.yours}</h2>
              <ul className="mt-3 space-y-3">
                {mine.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      <span className="block font-semibold">{tt.categories[r.category]}</span>
                      {pairLabel(r)}
                    </span>
                    {status === "open" && r.userId === user?.id && (
                      <form action={cancelRegistrationAction}>
                        <input type="hidden" name="registrationId" value={r.id} />
                        <ConfirmSubmit
                          message={tt.register.confirmCancel}
                          className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-semibold text-fg-muted hover:text-red-600"
                        >
                          {tt.register.cancel}
                        </ConfirmSubmit>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {status === "open" && (
            <Card>
              <h2 className="font-display text-lg font-bold">{tt.register.title}</h2>
              {user ? (
                <>
                  <p className="mt-1 text-sm text-fg-muted">{tt.register.text}</p>
                  <RegisterPairForm
                    tournamentId={x.id}
                    userName={user.name}
                    dict={dict}
                    categories={x.categories
                      .filter((c) => !mine.some((r) => r.category === c))
                      .map((c) => ({
                        value: c,
                        full: pairs.filter((p) => p.category === c).length >= x.maxPairs,
                      }))}
                    initialCategory={category}
                  />
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-fg-muted">{tt.register.loginText}</p>
                  <ButtonLink href={`${href(locale, "/acceso")}?next=${encodeURIComponent(pagePath)}`} className="mt-4 w-full">
                    <LogIn className="size-4" /> {tt.register.login}
                  </ButtonLink>
                </>
              )}
            </Card>
          )}
        </aside>

        <section className={cx("min-w-0", !x.bracketGenerated && "lg:col-span-2")}>
          <CategoryTabs categories={x.categories} active={category} hrefFor={(c) => `${pagePath}?cat=${c}`} dict={dict} />
          {x.bracketGenerated ? (
            <>
              <h2 className="mb-4 font-display text-xl font-bold">{tt.detail.bracket}</h2>
              {(brackets[category] ?? []).length > 0 ? (
                <BracketView bracket={brackets[category]!} dict={dict} />
              ) : (
                <p className="text-fg-muted">{tt.detail.noPairs}</p>
              )}
            </>
          ) : (
            <>
              <h2 className="mb-1 font-display text-xl font-bold">
                {tt.detail.registered}{" "}
                <span className="text-fg-muted">({t(tt.pairs, { n: categoryPairs.length, max: x.maxPairs })})</span>
              </h2>
              <p className="mb-4 text-sm text-fg-muted">{tt.detail.noBracket}</p>
              {categoryPairs.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line p-8 text-center text-fg-muted">{tt.detail.noPairs}</p>
              ) : (
                <ol className="grid gap-2 sm:grid-cols-2">
                  {categoryPairs.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm">
                      <span className="w-5 font-display font-extrabold text-fg-muted">{i + 1}</span>
                      <span className="truncate font-medium">{pairLabel(p)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </section>
      </div>
    </Container>
  );
}
