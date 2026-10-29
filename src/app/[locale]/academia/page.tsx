import { ArrowRight, CalendarClock, ClipboardList, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AcademyForm } from "@/components/academy-form";
import { ButtonLink, Card, Container, SectionHeading, cx } from "@/components/ui";
import { COACHES, LEVEL_TEST, getCoach } from "@/lib/academy";
import { euros, scheduleLabel } from "@/lib/academy-format";
import { groupsWithCounts, levelTestAvailability } from "@/lib/academy-service";
import { backend } from "@/lib/data";
import { formatDate, getDictionary, href, isLocale, t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.nav.academy, description: dict.academy.hero.subtitle };
}

const stepIcons = [ClipboardList, CalendarClock, Users];

export default async function AcademyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const a = dict.academy;

  const [user, counts, tests] = await Promise.all([
    backend.getCurrentUser(),
    backend.groupMemberCounts(),
    levelTestAvailability(),
  ]);
  const groups = groupsWithCounts(counts);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy-950 text-white">
        <Image src="/img/hero.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-900/40" />
        <Container className="py-20 sm:py-28">
          <div className="max-w-2xl animate-fade-up">
            <p className="text-sm font-semibold uppercase tracking-wider text-ball-400">{a.hero.eyebrow}</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {a.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-navy-100">{a.hero.subtitle}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="#solicitud" className="px-6 py-3 text-base">
                {a.hero.cta} <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="#grupos" variant="light" className="px-6 py-3 text-base">
                {a.hero.ctaSecondary}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading title={a.steps.title} />
          <ol className="grid gap-5 md:grid-cols-3">
            {a.steps.items.map((step, i) => {
              const Icon = stepIcons[i];
              return (
                <li key={step.title}>
                  <Card className="h-full">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-10 items-center justify-center rounded-full bg-ball-500 font-display font-extrabold text-navy-950">
                        {i + 1}
                      </span>
                      <Icon className="size-5 text-fg-muted" aria-hidden />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-fg-muted">{step.text}</p>
                  </Card>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      <section id="grupos" className="scroll-mt-20 bg-bg-soft py-20 sm:py-24">
        <Container>
          <SectionHeading title={a.groups.title} subtitle={a.groups.subtitle} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const free = Math.max(0, g.capacity - g.members);
              return (
                <Card key={g.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy-700 dark:bg-navy-900 dark:text-navy-100">
                      {a.levels[g.level]}
                    </span>
                    <p className="text-right font-display text-2xl font-extrabold">
                      {euros(locale, g.price)}
                      <span className="text-sm font-medium text-fg-muted">{a.groups.perMonth}</span>
                    </p>
                  </div>
                  <p className="mt-4 font-semibold">{scheduleLabel(dict, g)}</p>
                  <p className="mt-1 text-sm text-fg-muted">
                    {g.days.length > 1 ? a.groups.twoDays : a.groups.oneDay} ·{" "}
                    {t(a.groups.coach, { name: getCoach(g.coachId).name })}
                  </p>
                  <p className="mt-3 text-sm text-fg-muted">{a.levelText[g.level]}</p>
                  <div className="mt-auto pt-5">
                    <div className="mb-2 flex gap-1" aria-hidden>
                      {Array.from({ length: g.capacity }, (_, i) => (
                        <span key={i} className={cx("h-1.5 flex-1 rounded-full", i < g.members ? "bg-navy-500" : "bg-line")} />
                      ))}
                    </div>
                    <p
                      className={cx(
                        "text-sm font-semibold",
                        free === 0 ? "text-fg-muted" : free === 1 ? "text-ball-700 dark:text-ball-400" : "text-emerald-700 dark:text-emerald-400",
                      )}
                    >
                      {free === 0 ? a.groups.full : free === 1 ? a.groups.lastSpot : t(a.groups.spots, { n: free })}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading title={a.coaches.title} />
          <div className="grid gap-5 md:grid-cols-2">
            {COACHES.map((coach) => {
              const info = a.coaches.items[coach.id as keyof typeof a.coaches.items];
              const initials = coach.name
                .split(" ")
                .map((w) => w[0])
                .join("");
              return (
                <Card key={coach.id} className="flex items-start gap-5">
                  <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-navy-700 font-display text-xl font-extrabold text-ball-400">
                    {initials}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold">{coach.name}</h3>
                    <p className="text-sm font-semibold text-ball-700 dark:text-ball-400">{info.role}</p>
                    <p className="mt-2 text-fg-muted">{info.bio}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section id="solicitud" className="scroll-mt-20 bg-bg-soft py-20 sm:py-24">
        <Container className="max-w-3xl">
          <SectionHeading title={a.form.title} subtitle={a.form.subtitle} />
          <AcademyForm
            locale={locale}
            dict={a.form}
            weekdays={dict.common.weekdaysShort}
            court={LEVEL_TEST.courtId}
            user={user ? { name: user.name, email: user.email } : null}
            loginHref={`${href(locale, "/acceso")}?next=${encodeURIComponent(`${href(locale, "/academia")}#solicitud`)}`}
            myBookingsHref={href(locale, "/mis-reservas")}
            myBookingsLabel={dict.nav.myBookings}
            tests={tests.map((test) => ({
              value: `${test.date} ${test.slot}`,
              label: `${formatDate(locale, test.date, { weekday: "long", month: "long" })} · ${test.slot}`,
              free: test.free,
            }))}
          />
        </Container>
      </section>
    </>
  );
}
