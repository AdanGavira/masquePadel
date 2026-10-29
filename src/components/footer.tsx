import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CLUB } from "@/lib/club";
import { getDictionary, href, t, type Locale } from "@/lib/i18n";
import { Container } from "./ui";

export function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const hours = { open: CLUB.opensAt, close: CLUB.closesAt };

  return (
    <footer className="bg-navy-950 text-navy-100">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 font-display text-lg font-extrabold text-white">
            <Image src="/img/logo.png" alt="" width={40} height={40} className="rounded-full bg-white" />
            <span>
              masque<span className="text-ball-400">Padel</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-navy-200">{dict.footer.tagline}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{dict.footer.contact}</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="size-4 shrink-0 text-ball-400" />
              <span>
                {CLUB.address.street}
                <br />
                {CLUB.address.postalCode} {CLUB.address.city}
              </span>
            </li>
            <li className="flex gap-2">
              <Mail className="size-4 shrink-0 text-ball-400" />
              <a href={`mailto:${CLUB.contact.email}`} className="hover:text-white">
                {CLUB.contact.email}
              </a>
            </li>
            <li className="flex gap-2">
              <Phone className="size-4 shrink-0 text-ball-400" />
              {CLUB.contact.phone}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{dict.footer.hours}</h3>
          <p className="mt-4 flex gap-2 text-sm">
            <Clock className="size-4 shrink-0 text-ball-400" />
            {t(dict.footer.hoursText, hours)}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{dict.footer.links}</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href={href(locale, "/reservas")} className="hover:text-white">
                {dict.nav.booking}
              </Link>
            </li>
            <li>
              <Link href={href(locale, "/mis-reservas")} className="hover:text-white">
                {dict.nav.myBookings}
              </Link>
            </li>
            <li>
              <Link href={`${href(locale)}#precios`} className="hover:text-white">
                {dict.home.pricing.title}
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} masquePadel · {dict.footer.rights}</span>
          <nav aria-label={dict.footer.legal} className="flex flex-wrap gap-x-4 gap-y-1">
            {(
              [
                ["aviso-legal", dict.footer.legalNotice],
                ["privacidad", dict.footer.privacy],
                ["cookies", dict.footer.cookies],
              ] as const
            ).map(([doc, label]) => (
              <Link key={doc} href={href(locale, `/legal/${doc}`)} className="hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </footer>
  );
}
