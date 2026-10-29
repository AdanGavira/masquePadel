import { Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductArt } from "@/components/product-art";
import { Container, cx } from "@/components/ui";
import { backend } from "@/lib/data";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { PRODUCT_CATEGORIES, formatPrice, totalStock, type ProductCategory } from "@/lib/shop";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return { title: dict.shop.title, description: dict.shop.subtitle };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const s = dict.shop;
  const { cat } = await searchParams;
  const category = PRODUCT_CATEGORIES.includes(cat as ProductCategory) ? (cat as ProductCategory) : null;
  const products = (await backend.listProducts()).filter((p) => p.active && (!category || p.category === category));
  const base = href(locale, "/tienda");

  return (
    <Container className="py-10 sm:py-14">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{s.title}</h1>
          <p className="mt-3 text-lg text-fg-muted">{s.subtitle}</p>
        </div>
        <div className="flex max-w-sm items-start gap-3 rounded-2xl bg-bg-soft p-4 text-sm">
          <Store className="mt-0.5 size-5 shrink-0 text-ball-500" />
          <p>
            <span className="font-semibold">{s.pickup.title}.</span> <span className="text-fg-muted">{s.pickup.text}</span>
          </p>
        </div>
      </header>

      <nav aria-label={s.title} className="mb-8 flex flex-wrap gap-2">
        {[null, ...PRODUCT_CATEGORIES].map((c) => (
          <Link
            key={c ?? "all"}
            href={c ? `${base}?cat=${c}` : base}
            scroll={false}
            aria-current={c === category ? "page" : undefined}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              c === category
                ? "border-navy-700 bg-navy-700 text-white dark:border-ball-500 dark:bg-ball-500 dark:text-navy-950"
                : "border-line text-fg-muted hover:text-fg",
            )}
          >
            {c ? s.categories[c] : s.all}
          </Link>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-fg-muted">{s.empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => {
            const stock = totalStock(p);
            return (
              <li key={p.id}>
                <Link href={href(locale, `/tienda/${p.id}`)} className="group block">
                  <div className="relative overflow-hidden rounded-2xl border border-line">
                    <ProductArt product={p} className="transition-transform duration-300 group-hover:scale-105" />
                    {stock === 0 && (
                      <span className="absolute left-3 top-3 rounded-full bg-navy-950/80 px-2.5 py-1 text-xs font-semibold text-white">
                        {s.outOfStock}
                      </span>
                    )}
                    {p.category === "palas" && p.level && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-navy-800">
                        {s.levels[p.level]}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">{p.brand}</p>
                  <p className="mt-0.5 font-display font-bold leading-snug group-hover:underline">{p.name}</p>
                  <p className="mt-1 font-semibold">{formatPrice(locale, p.price)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
