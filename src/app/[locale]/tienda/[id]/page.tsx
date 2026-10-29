import { ArrowLeft, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductArt } from "@/components/product-art";
import { Container } from "@/components/ui";
import { backend } from "@/lib/data";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { formatPrice, hasSizes } from "@/lib/shop";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const product = await backend.getProduct(id);
  if (!product?.active) return {};
  return {
    title: `${product.brand} ${product.name}`,
    description: locale === "es" ? product.descriptionEs : product.descriptionEn || product.descriptionEs,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const product = await backend.getProduct(id);
  if (!product || !product.active) notFound();
  const dict = getDictionary(locale);
  const s = dict.shop;
  const description = locale === "es" ? product.descriptionEs : product.descriptionEn || product.descriptionEs;

  return (
    <Container className="py-10 sm:py-14">
      <Link href={href(locale, "/tienda")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {s.back}
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-3xl border border-line">
          <ProductArt product={product} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            {product.brand} · {s.categories[product.category]}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-4 font-display text-3xl font-extrabold">{formatPrice(locale, product.price)}</p>
          {description && <p className="mt-6 text-lg text-fg-muted">{description}</p>}

          {product.category === "palas" && (product.shape || product.level) && (
            <dl className="mt-6 grid grid-cols-2 gap-3">
              {product.shape && (
                <div className="rounded-2xl bg-bg-soft p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-fg-muted">{s.shape}</dt>
                  <dd className="mt-1 font-semibold">{s.shapes[product.shape]}</dd>
                </div>
              )}
              {product.level && (
                <div className="rounded-2xl bg-bg-soft p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-fg-muted">{s.level}</dt>
                  <dd className="mt-1 font-semibold">{s.levels[product.level]}</dd>
                </div>
              )}
            </dl>
          )}

          <AddToCart
            productId={product.id}
            variants={product.variants}
            withSizes={hasSizes(product.category)}
            cartHref={href(locale, "/tienda/carrito")}
            dict={s}
          />

          <p className="mt-8 flex items-start gap-3 border-t border-line pt-6 text-sm">
            <Store className="mt-0.5 size-5 shrink-0 text-ball-500" />
            <span>
              <span className="font-semibold">{s.pickup.title}.</span> <span className="text-fg-muted">{s.pickup.text}</span>
            </span>
          </p>
        </div>
      </div>
    </Container>
  );
}
