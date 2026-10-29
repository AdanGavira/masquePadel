import { backend } from "@/lib/data";
import { getDictionary, href, type Locale } from "@/lib/i18n";
import { HeaderNav } from "./header-nav";

export async function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const user = await backend.getCurrentUser();

  return (
    <HeaderNav
      locale={locale}
      dict={dict.nav}
      user={user ? { name: user.name, isAdmin: user.role === "admin" } : null}
      links={[
        { href: href(locale, "/reservas"), label: dict.nav.booking },
        { href: href(locale, "/tienda"), label: dict.nav.shop },
        { href: href(locale, "/torneos"), label: dict.nav.tournaments },
        { href: href(locale, "/academia"), label: dict.nav.academy },
      ]}
    />
  );
}
