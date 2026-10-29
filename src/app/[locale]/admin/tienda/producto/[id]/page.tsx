import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/components/admin-guard";
import { AdminTabs } from "@/components/admin-tabs";
import { ProductForm } from "@/components/product-form";
import { Card, Container } from "@/components/ui";
import { backend } from "@/lib/data";
import { getDictionary, href, isLocale } from "@/lib/i18n";

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).shop.admin.products, robots: { index: false } } : {};
}

export default async function AdminProductPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const { denied } = await requireAdminPage(locale, `/admin/tienda/producto/${id}`);
  if (denied) return denied;
  const dict = getDictionary(locale);
  const product = id === "nuevo" ? null : await backend.getProduct(id);
  if (id !== "nuevo" && !product) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.admin.title}</h1>
      <p className="mb-6 mt-2 text-fg-muted">{dict.shop.subtitle}</p>
      <AdminTabs locale={locale} active="shop" dict={dict} />
      <Link
        href={`${href(locale, "/admin/tienda")}?view=productos`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> {dict.shop.admin.products}
      </Link>
      <h2 className="mb-6 mt-3 font-display text-2xl font-extrabold">{product ? product.name : dict.shop.admin.newProduct}</h2>
      <Card className="max-w-3xl">
        <ProductForm product={product} dict={dict.shop} locale={locale} />
      </Card>
    </Container>
  );
}
