import { CalendarClock, Mail, Phone, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminRequestForm } from "@/components/admin-request-form";
import { AdminTabs } from "@/components/admin-tabs";
import { Card, Container, cx } from "@/components/ui";
import { LEVEL_TEST, getCoach, getGroup } from "@/lib/academy";
import { groupName, scheduleLabel } from "@/lib/academy-format";
import { groupsWithCounts, levelTestAvailability } from "@/lib/academy-service";
import { backend, type AcademyRequest, type AcademyStatus } from "@/lib/data";
import { formatDate, getDictionary, href, isLocale, t, type Dictionary, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).academy.admin.title, robots: { index: false } } : {};
}

const FILTERS: (AcademyStatus | "all")[] = ["pending", "assigned", "waitlist", "cancelled", "all"];

export default async function AdminAcademyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const a = dict.academy.admin;

  const user = await backend.getCurrentUser();
  if (!user) redirect(`${href(locale, "/acceso")}?next=${encodeURIComponent(href(locale, "/admin/academia"))}`);
  if (user.role !== "admin") {
    return (
      <Container className="py-24 text-center">
        <ShieldAlert className="mx-auto size-12 text-fg-muted" />
        <p className="mt-4 text-lg">{dict.admin.forbidden}</p>
      </Container>
    );
  }

  const { status: requested } = await searchParams;
  const filter = FILTERS.find((f) => f === requested) ?? "pending";

  const [requests, counts, tests] = await Promise.all([
    backend.listAcademyRequests(),
    backend.groupMemberCounts(),
    levelTestAvailability(),
  ]);
  const groups = groupsWithCounts(counts);
  const shown = requests
    .filter((r) => filter === "all" || r.status === filter)
    .sort((x, y) => `${x.testDate ?? "9"}${x.testSlot}`.localeCompare(`${y.testDate ?? "9"}${y.testSlot}`));
  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: `${groupName(dict, g)} (${g.members}/${g.capacity})`,
  }));

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.admin.title}</h1>
      <p className="mb-6 mt-2 text-fg-muted">{a.subtitle}</p>
      <AdminTabs locale={locale} active="academy" dict={a} />

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 font-display text-xl font-bold">{a.groups}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => {
              const names = requests.filter((r) => r.status === "assigned" && r.groupId === g.id).map((r) => r.name);
              return (
                <Card key={g.id} className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-bold">{dict.academy.levels[g.level]}</p>
                    <p className={cx("text-sm font-semibold", g.members >= g.capacity && "text-red-600 dark:text-red-300")}>
                      {t(a.members, { n: g.members, max: g.capacity })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    {scheduleLabel(dict, g)} · {t(dict.booking.court, { n: g.courtId })} · {getCoach(g.coachId).name}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-soft">
                    <div
                      className="h-full rounded-full bg-navy-500"
                      style={{ width: `${Math.min(100, (g.members / g.capacity) * 100)}%` }}
                    />
                  </div>
                  {names.length > 0 && <p className="mt-3 text-xs text-fg-muted">{names.join(", ")}</p>}
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-bold">{a.tests}</h2>
          <Card className="divide-y divide-line p-0">
            {tests.map((test) => {
              const names = requests
                .filter((r) => r.testDate === test.date && r.testSlot === test.slot && r.status !== "cancelled")
                .map((r) => r.name);
              return (
                <div key={`${test.date}${test.slot}`} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-semibold">
                      <CalendarClock className="size-4 text-fg-muted" />
                      <span className="first-letter:uppercase">{formatDate(locale, test.date)}</span> · {test.slot}
                    </p>
                    <p className="text-sm text-fg-muted">
                      {t(a.testCount, { n: LEVEL_TEST.capacity - test.free, max: LEVEL_TEST.capacity })}
                    </p>
                  </div>
                  {names.length > 0 && <p className="mt-1 text-xs text-fg-muted">{names.join(", ")}</p>}
                </div>
              );
            })}
          </Card>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-xl font-bold">{a.requests}</h2>
        <nav aria-label={a.status} className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const n = f === "all" ? requests.length : requests.filter((r) => r.status === f).length;
            return (
              <Link
                key={f}
                href={`${href(locale, "/admin/academia")}?status=${f}`}
                aria-current={f === filter ? "page" : undefined}
                className={cx(
                  "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                  f === filter
                    ? "border-navy-700 bg-navy-700 text-white dark:border-ball-500 dark:bg-ball-500 dark:text-navy-950"
                    : "border-line text-fg-muted hover:text-fg",
                )}
              >
                {f === "all" ? a.all : dict.academy.status[f]} <span className="opacity-70">{n}</span>
              </Link>
            );
          })}
        </nav>

        {shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-fg-muted">{a.empty}</p>
        ) : (
          <ul className="space-y-4">
            {shown.map((r) => (
              <RequestCard key={r.id} request={r} locale={locale} dict={dict} groupOptions={groupOptions} />
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}

function RequestCard({
  request: r,
  locale,
  dict,
  groupOptions,
}: {
  request: AcademyRequest;
  locale: Locale;
  dict: Dictionary;
  groupOptions: { value: string; label: string }[];
}) {
  const a = dict.academy;
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => r.preferredDays.includes(d)).map((d) => dict.common.weekdaysShort[d]);
  const group = getGroup(r.groupId);

  return (
    <li>
      <Card className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-display text-lg font-bold">{r.name}</h3>
            <span className="rounded-full bg-bg-soft px-2.5 py-0.5 text-xs font-semibold text-fg-muted">
              {r.forWhom === "child" ? t(a.admin.child, { age: r.childAge ?? "" }) : a.admin.adult}
            </span>
            <span className="text-xs text-fg-muted">
              {t(a.admin.received, { date: formatDate(locale, r.createdAt.slice(0, 10)) })}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 hover:underline">
              <Mail className="size-4 text-fg-muted" /> {r.email}
            </a>
            <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:underline">
              <Phone className="size-4 text-fg-muted" /> {r.phone}
            </a>
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-fg-muted">{a.form.experience}</dt>
              <dd className="font-medium">{a.form.experiences[r.experience]}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">{a.form.levelTest}</dt>
              <dd className="font-medium">
                {r.testDate ? `${formatDate(locale, r.testDate)} · ${r.testSlot}` : a.admin.noTest}
              </dd>
            </div>
            <div>
              <dt className="text-fg-muted">{a.form.days}</dt>
              <dd className="font-medium capitalize">{days.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">{a.form.time}</dt>
              <dd className="font-medium">{r.preferredTime ? a.form.times[r.preferredTime] : "—"}</dd>
            </div>
          </dl>
          {r.notes && <p className="mt-4 rounded-xl bg-bg-soft p-3 text-sm italic text-fg-muted">“{r.notes}”</p>}
          {group && (
            <p className="mt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{groupName(dict, group)}</p>
          )}
        </div>
        <div className="lg:col-span-2">
          <AdminRequestForm
            id={r.id}
            status={r.status}
            assessedLevel={r.assessedLevel}
            groupId={r.groupId}
            groupOptions={groupOptions}
            dict={a}
          />
        </div>
      </Card>
    </li>
  );
}
