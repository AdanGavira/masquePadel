import {
  ArrowRight,
  Car,
  Check,
  Coffee,
  GraduationCap,
  Lightbulb,
  MapPin,
  ShoppingBag,
  ShowerHead,
  Smartphone,
  Sparkles,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ButtonLink, Card, Container, SectionHeading } from "@/components/ui";
import { CLUB, COURTS, PRICE_PER_PLAYER } from "@/lib/club";
import { getDictionary, href, isLocale, t } from "@/lib/i18n";
import { getSlots, slotEnd } from "@/lib/slots";

const featureIcons = [Sparkles, Lightbulb, Smartphone, ShowerHead, Car, Coffee];
const soonIcons = [ShoppingBag, Trophy];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const home = dict.home;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CLUB.address.mapsQuery)}`;

  return (
    <>
      {/* Portada */}
      <section className="relative isolate overflow-hidden bg-navy-950 text-white">
        <Image src="/img/hero.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-900/30" />
        <Container className="py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-medium text-ball-300 backdrop-blur">
              <MapPin className="size-4" /> {home.hero.eyebrow}
            </p>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {home.hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-navy-100 sm:text-xl">{home.hero.subtitle}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href={href(locale, "/reservas")} className="px-6 py-3 text-base">
                {home.hero.ctaPrimary} <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="#precios" variant="light" className="px-6 py-3 text-base">
                {home.hero.ctaSecondary}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Cifras */}
      <section className="border-b border-line bg-bg-soft">
        <Container className="grid grid-cols-2 gap-px py-2 lg:grid-cols-4">
          {home.stats.map((stat) => (
            <div key={stat.label} className="px-4 py-6 text-center">
              <p className="font-display text-3xl font-extrabold text-navy-700 dark:text-ball-400">{stat.value}</p>
              <p className="mt-1 text-sm text-fg-muted">{stat.label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Servicios */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading title={home.features.title} subtitle={home.features.subtitle} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {home.features.items.map((item, i) => {
              const Icon = featureIcons[i];
              return (
                <Card key={item.title} className="transition-shadow hover:shadow-lg hover:shadow-navy-900/5">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 dark:bg-navy-900 dark:text-ball-400">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-fg-muted">{item.text}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Pistas */}
      <section className="bg-bg-soft py-20 sm:py-28">
        <Container>
          <SectionHeading title={home.courts.title} subtitle={home.courts.subtitle} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COURTS.map((court) => (
              <Card key={court.id} className="overflow-hidden p-0">
                <CourtDiagram highlight={court.kind === "panoramic"} />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold">{t(dict.booking.court, { n: court.id })}</h3>
                    <span className="rounded-full bg-ball-400/20 px-2.5 py-0.5 text-xs font-semibold text-ball-600 dark:text-ball-400">
                      {court.kind === "panoramic" ? home.courts.panoramic : home.courts.glass}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-fg-muted">
                    {court.kind === "panoramic" ? home.courts.panoramicText : home.courts.glassText}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Precios y horario */}
      <section id="precios" className="scroll-mt-20 py-20 sm:py-28">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading title={home.pricing.title} subtitle={home.pricing.subtitle} />
            <div className="relative overflow-hidden rounded-3xl bg-navy-800 p-8 text-white shadow-xl shadow-navy-900/20 sm:p-10">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-ball-500/20 blur-2xl" />
              <p className="font-display text-6xl font-extrabold">
                {locale === "es" ? `${CLUB.pricePerCourt} €` : `€${CLUB.pricePerCourt}`}
              </p>
              <p className="mt-1 text-navy-200">{home.pricing.perCourt}</p>
              <p className="mt-4 inline-block rounded-full bg-ball-500 px-3 py-1 text-sm font-bold text-navy-950">
                {t(home.pricing.perPlayer, { price: PRICE_PER_PLAYER })}
              </p>
              <ul className="mt-8 space-y-3">
                {home.pricing.includes.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="size-5 text-ball-400" /> {item}
                  </li>
                ))}
              </ul>
              <ButtonLink href={href(locale, "/reservas")} className="mt-8">
                {home.pricing.cta} <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>

          <div>
            <SectionHeading
              title={home.schedule.title}
              subtitle={t(home.schedule.text, { open: CLUB.opensAt, close: CLUB.closesAt })}
            />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {getSlots().map((slot) => (
                <li
                  key={slot}
                  className="rounded-xl border border-line bg-card px-4 py-3 text-center font-semibold tabular-nums"
                >
                  {slot} – {slotEnd(slot)}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Academia */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-navy-800 px-8 py-12 text-white sm:px-12 lg:py-16">
            <GraduationCap className="absolute -bottom-6 -right-6 size-48 text-white/5 sm:size-64" aria-hidden />
            <p className="text-sm font-semibold uppercase tracking-wider text-ball-400">{home.academyPromo.eyebrow}</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {home.academyPromo.title}
            </h2>
            <p className="mt-4 max-w-xl text-lg text-navy-100">{home.academyPromo.text}</p>
            <ButtonLink href={href(locale, "/academia")} className="mt-8">
              {home.academyPromo.cta} <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Próximamente */}
      <section id="proximamente" className="scroll-mt-20 bg-bg-soft py-20 sm:py-28">
        <Container>
          <SectionHeading title={home.soon.title} subtitle={home.soon.subtitle} center />
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            {home.soon.items.map((item, i) => {
              const Icon = soonIcons[i];
              return (
                <Card key={item.title} className="relative">
                  <span className="absolute right-5 top-5 rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-fg-muted">
                    {home.soon.badge}
                  </span>
                  <Icon className="size-8 text-ball-500" />
                  <h3 className="mt-4 font-display text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-fg-muted">{item.text}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Ubicación */}
      <section className="py-20 sm:py-28">
        <Container className="grid gap-10 lg:grid-cols-5 lg:items-center">
          <div className="lg:col-span-2">
            <SectionHeading title={home.location.title} subtitle={home.location.text} />
            <p className="flex gap-3 text-lg font-medium">
              <MapPin className="mt-1 size-5 shrink-0 text-ball-500" />
              <span>
                {CLUB.address.street}
                <br />
                {CLUB.address.postalCode} {CLUB.address.city}
              </span>
            </p>
            <ButtonLink href={mapsUrl} target="_blank" rel="noopener noreferrer" variant="ghost" className="mt-6">
              {home.location.directions} <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
          <div className="overflow-hidden rounded-3xl border border-line lg:col-span-3">
            <iframe
              title={home.location.mapTitle}
              src={`https://www.google.com/maps?q=${encodeURIComponent(CLUB.address.mapsQuery)}&output=embed`}
              className="h-80 w-full sm:h-96"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-bg-soft py-20 sm:py-28">
        <Container className="max-w-3xl">
          <SectionHeading title={home.faq.title} center />
          <div className="divide-y divide-line rounded-2xl border border-line bg-card">
            {home.faq.items.map((item) => (
              <details key={item.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span className="text-xl text-ball-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-fg-muted">{t(item.a, { max: CLUB.maxActiveBookingsPerUser })}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Llamada final */}
      <section className="py-20">
        <Container>
          <div className="flex flex-col items-start gap-6 rounded-3xl bg-ball-500 px-8 py-12 text-navy-950 sm:px-12 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{home.finalCta.title}</h2>
              <p className="mt-2 max-w-xl text-lg text-navy-900/80">{home.finalCta.text}</p>
            </div>
            <ButtonLink href={href(locale, "/reservas")} variant="secondary" className="shrink-0 px-6 py-3 text-base">
              {home.finalCta.cta} <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}

/** Esquema de pista de pádel visto desde arriba. */
function CourtDiagram({ highlight }: { highlight: boolean }) {
  return (
    <div className="bg-court-500 p-4">
      <svg viewBox="0 0 200 100" className="w-full" aria-hidden="true">
        <rect x="2" y="2" width="196" height="96" rx="2" fill="none" stroke="white" strokeWidth="2" />
        <line x1="100" y1="2" x2="100" y2="98" stroke="white" strokeWidth="3" strokeDasharray="2 2" />
        <line x1="31" y1="2" x2="31" y2="98" stroke="white" strokeWidth="1.5" />
        <line x1="169" y1="2" x2="169" y2="98" stroke="white" strokeWidth="1.5" />
        <line x1="31" y1="50" x2="169" y2="50" stroke="white" strokeWidth="1.5" />
        {highlight && (
          <rect x="0.5" y="0.5" width="199" height="99" rx="3" fill="none" stroke="#ffd23f" strokeWidth="1" opacity="0.8" />
        )}
        <circle cx="140" cy="30" r="4" fill="#ffd23f" />
      </svg>
    </div>
  );
}
