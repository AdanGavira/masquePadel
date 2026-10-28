import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingGrid, type CellState } from "@/components/booking-grid";
import { academyCells } from "@/lib/academy";
import { DateStrip } from "@/components/date-strip";
import { Container } from "@/components/ui";
import { CLUB, COURTS, PRICE_PER_PLAYER } from "@/lib/club";
import { backend } from "@/lib/data";
import { formatDate, getDictionary, href, isLocale, t } from "@/lib/i18n";
import { getSlots, hasSlotStarted, isBookableDate, slotEnd } from "@/lib/slots";
import { todayKey } from "@/lib/time";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).booking.title } : {};
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const { date: requested } = await searchParams;
  const date = isBookableDate(requested) ? requested : todayKey();

  const user = await backend.getCurrentUser();
  const occupied = await backend.getOccupied(date, user?.id ?? null);
  const classes = academyCells(date);

  const rows = getSlots().map((slot) => {
    const started = hasSlotStarted(date, slot);
    return {
      slot,
      end: slotEnd(slot),
      cells: COURTS.map(({ id }) => {
        const hit = occupied.find((o) => o.courtId === id && o.slot === slot);
        let state: CellState = "free";
        if (classes.some((c) => c.courtId === id && c.slot === slot)) state = "class";
        else if (hit?.mine) state = "mine";
        else if (hit) state = hit.kind;
        else if (started) state = "past";
        return { courtId: id, state };
      }),
    };
  });

  const bookingPath = `${href(locale, "/reservas")}?date=${date}`;

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.booking.title}</h1>
        <p className="mt-2 text-fg-muted">
          {t(dict.booking.subtitle, { price: CLUB.pricePerCourt, perPlayer: PRICE_PER_PLAYER })}
        </p>
      </header>

      <DateStrip locale={locale} path="/reservas" selected={date} todayLabel={dict.booking.today} />

      <BookingGrid
        key={date}
        locale={locale}
        date={date}
        dateLabel={formatDate(locale, date, { weekday: "long", month: "long" })}
        courts={COURTS.map((c) => c.id)}
        rows={rows}
        loggedIn={Boolean(user)}
        loginHref={`${href(locale, "/acceso")}?next=${encodeURIComponent(bookingPath)}`}
        dict={dict.booking}
        maxActive={CLUB.maxActiveBookingsPerUser}
        price={CLUB.pricePerCourt}
        pricePerPlayer={PRICE_PER_PLAYER}
        myBookingsLabel={dict.nav.myBookings}
      />
    </Container>
  );
}
