import { CalendarDays, Clock } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { ButtonLink, Container, cx } from "@/components/ui";
import { isUpcoming } from "@/lib/bookings";
import { CLUB } from "@/lib/club";
import { backend, type Booking } from "@/lib/data";
import { formatDate, getDictionary, href, isLocale, t, type Dictionary, type Locale } from "@/lib/i18n";
import { canCancel, slotEnd } from "@/lib/slots";
import { clubNowParts, clubTimeToDate, todayKey } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).myBookings.title } : {};
}

const byStart = (a: Booking, b: Booking) => `${a.date} ${a.slot}`.localeCompare(`${b.date} ${b.slot}`);

export default async function MyBookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const user = await backend.getCurrentUser();
  if (!user) redirect(`${href(locale, "/acceso")}?next=${encodeURIComponent(href(locale, "/mis-reservas"))}`);

  const all = await backend.listUserBookings(user.id);
  const upcoming = all.filter((b) => isUpcoming(b)).sort(byStart);
  const history = all
    .filter((b) => !isUpcoming(b))
    .sort(byStart)
    .reverse()
    .slice(0, 20);

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.myBookings.title}</h1>
      <p className="mt-2 text-fg-muted">{user.name}</p>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">
          {dict.myBookings.upcoming} <span className="text-fg-muted">({upcoming.length})</span>
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <CalendarDays className="mx-auto size-10 text-fg-muted" />
            <p className="mt-3 text-fg-muted">{dict.myBookings.empty}</p>
            <ButtonLink href={href(locale, "/reservas")} className="mt-6">
              {dict.myBookings.emptyCta}
            </ButtonLink>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b) => (
              <BookingItem key={b.id} booking={b} locale={locale} dict={dict} />
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-xl font-bold">{dict.myBookings.past}</h2>
          <ul className="space-y-3">
            {history.map((b) => (
              <BookingItem key={b.id} booking={b} locale={locale} dict={dict} />
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}

function BookingItem({ booking, locale, dict }: { booking: Booking; locale: Locale; dict: Dictionary }) {
  const upcoming = isUpcoming(booking);
  const cancellable = upcoming && canCancel(booking.date, booking.slot);
  // Fecha y hora límite para cancelar, en hora del club.
  const deadline = new Date(clubTimeToDate(booking.date, booking.slot).getTime() - CLUB.cancellationHours * 3600_000);
  const { hour, minute } = clubNowParts(deadline);

  return (
    <li
      className={cx(
        "flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center",
        !upcoming && "opacity-70",
      )}
    >
      <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-700 text-white dark:bg-navy-600">
        <span className="text-[11px] font-semibold uppercase">
          {formatDate(locale, booking.date, { weekday: undefined, day: undefined, month: "short" }).replace(".", "")}
        </span>
        <span className="font-display text-2xl font-extrabold leading-none">{Number(booking.date.slice(8))}</span>
      </div>
      <div className="flex-1">
        <p className="font-display text-lg font-bold">
          {t(dict.booking.court, { n: booking.courtId })}
          <span className="ml-2 inline-block text-sm font-medium text-fg-muted first-letter:uppercase">
            {formatDate(locale, booking.date, { weekday: "long" })}
          </span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted tabular-nums">
          <Clock className="size-4" /> {booking.slot} – {slotEnd(booking.slot)}
        </p>
        {upcoming && (
          <p className="mt-1 text-xs text-fg-muted">
            {cancellable
              ? t(dict.myBookings.cancellableUntil, {
                  date: formatDate(locale, todayKey(deadline)),
                  time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
                })
              : dict.myBookings.notCancellable}
          </p>
        )}
      </div>
      {upcoming ? (
        cancellable && <CancelBookingButton bookingId={booking.id} dict={dict.myBookings} />
      ) : (
        <span className="text-sm font-semibold text-fg-muted">
          {booking.status === "cancelled" ? dict.myBookings.cancelled : dict.myBookings.played}
        </span>
      )}
    </li>
  );
}
