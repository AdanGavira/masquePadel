import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartView } from "@/components/cart-view";
import { Container } from "@/components/ui";
import { backend } from "@/lib/data";
import { getDictionary, href, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).shop.cart.title, robots: { index: false } } : {};
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const [user, products] = await Promise.all([backend.getCurrentUser(), backend.listProducts()]);

  return (
    <Container className="max-w-4xl py-10 sm:py-14">
      <h1 className="mb-8 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.shop.cart.title}</h1>
      <CartView
        locale={locale}
        dict={dict.shop}
        products={products.filter((p) => p.active)}
        loggedIn={Boolean(user)}
        loginHref={`${href(locale, "/acceso")}?next=${encodeURIComponent(href(locale, "/tienda/carrito"))}`}
        shopHref={href(locale, "/tienda")}
        myBookingsHref={href(locale, "/mis-reservas")}
        myBookingsLabel={dict.nav.myBookings}
      />
    </Container>
  );
}
