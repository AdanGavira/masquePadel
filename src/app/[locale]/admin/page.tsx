import { Lock, ShieldAlert, Unlock, X } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { adminBlockAction, adminCancelAction } from "@/app/actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { DateStrip } from "@/components/date-strip";
import { Card, Container } from "@/components/ui";
import { CLUB, COURTS } from "@/lib/club";
import { backend } from "@/lib/data";
import { formatDate, getDictionary, href, isLocale, t } from "@/lib/i18n";
import { getSlots, hasSlotStarted, isBookableDate, slotEnd } from "@/lib/slots";
import { todayKey } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).admin.title, robots: { index: false } } : {};
}

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const user = await backend.getCurrentUser();
  if (!user) redirect(`${href(locale, "/acceso")}?next=${encodeURIComponent(href(locale, "/admin"))}`);
  if (user.role !== "admin") {
    return (
      <Container className="py-24 text-center">
        <ShieldAlert className="mx-auto size-12 text-fg-muted" />
        <p className="mt-4 text-lg">{dict.admin.forbidden}</p>
      </Container>
    );
  }

  const { date: requested } = await searchParams;
  const date = isBookableDate(requested) ? requested : todayKey();
  const [bookings, blocks] = await Promise.all([backend.listDayBookings(date), backend.listBlocks(date)]);

  const slots = getSlots();
  const totalCells = slots.length * COURTS.length;
  const occupancy = Math.round((bookings.length / totalCells) * 100);
  const revenue = bookings.length * CLUB.pricePerCourt;

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.admin.title}</h1>
      <p className="mb-8 mt-2 text-fg-muted">{dict.admin.subtitle}</p>

      <DateStrip locale={locale} path="/admin" selected={date} todayLabel={dict.booking.today} />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-fg-muted first-letter:uppercase">{formatDate(locale, date, { weekday: "long", month: "long" })}</p>
          <p className="mt-1 font-display text-3xl font-extrabold">
            {bookings.length}
            <span className="text-lg text-fg-muted">/{totalCells}</span>
          </p>
        </Card>
        <Card>
          <p className="text-sm text-fg-muted">{dict.admin.occupancy}</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{occupancy}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-soft">
            <div className="h-full rounded-full bg-ball-500" style={{ width: `${occupancy}%` }} />
          </div>
        </Card>
        <Card>
          <p className="text-sm text-fg-muted">{dict.admin.revenue}</p>
          <p className="mt-1 font-display text-3xl font-extrabold">
            {locale === "es" ? `${revenue} €` : `€${revenue}`}
          </p>
        </Card>
      </div>

      <h2 className="mb-4 font-display text-xl font-bold">
        {t(dict.admin.bookingsOf, { date: formatDate(locale, date) })}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-bg-soft text-left">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                <span className="sr-only">Turno</span>
              </th>
              {COURTS.map((c) => (
                <th key={c.id} scope="col" className="px-3 py-3 font-display font-bold">
                  {t(dict.booking.court, { n: c.id })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {slots.map((slot) => {
              const started = hasSlotStarted(date, slot);
              return (
                <tr key={slot}>
                  <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-semibold tabular-nums">
                    {slot} – {slotEnd(slot)}
                  </th>
                  {COURTS.map(({ id }) => {
                    const booking = bookings.find((b) => b.courtId === id && b.slot === slot);
                    const blocked = blocks.some((b) => b.courtId === id && b.slot === slot);
                    return (
                      <td key={id} className="px-3 py-2 align-top">
                        {booking ? (
                          <div className="flex items-start justify-between gap-2 rounded-lg bg-navy-50 px-3 py-2 dark:bg-navy-900/60">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{booking.userName}</p>
                              <p className="truncate text-xs text-fg-muted">{booking.userEmail}</p>
                            </div>
                            {!started && (
                              <form action={adminCancelAction}>
                                <input type="hidden" name="bookingId" value={booking.id} />
                                <ConfirmSubmit
                                  message={dict.admin.confirmCancel}
                                  title={dict.admin.cancelBooking}
                                  className="rounded-full p-1 text-fg-muted hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950"
                                >
                                  <X className="size-4" />
                                </ConfirmSubmit>
                              </form>
                            )}
                          </div>
                        ) : started ? (
                          <span className="text-fg-muted/50">—</span>
                        ) : (
                          <form action={adminBlockAction} className="flex items-center justify-between gap-2 px-3 py-2">
                            <input type="hidden" name="courtId" value={id} />
                            <input type="hidden" name="date" value={date} />
                            <input type="hidden" name="slot" value={slot} />
                            <input type="hidden" name="blocked" value={String(!blocked)} />
                            <span className={blocked ? "font-semibold text-red-700 dark:text-red-300" : "text-fg-muted"}>
                              {blocked ? dict.admin.blocked : dict.admin.free}
                            </span>
                            <button
                              type="submit"
                              title={blocked ? dict.admin.unblock : dict.admin.block}
                              aria-label={`${blocked ? dict.admin.unblock : dict.admin.block} ${t(dict.booking.court, { n: id })} ${slot}`}
                              className="rounded-full p-1 text-fg-muted hover:bg-bg-soft hover:text-fg"
                            >
                              {blocked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                            </button>
                          </form>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
