import { Mail, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelOrderAction, setOrderStatusAction } from "@/app/actions";
import { requireAdminPage } from "@/components/admin-guard";
import { AdminTabs } from "@/components/admin-tabs";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { ProductArt } from "@/components/product-art";
import { ButtonLink, Card, Container, cx } from "@/components/ui";
import { backend } from "@/lib/data";
import { formatDate, getDictionary, href, isLocale } from "@/lib/i18n";
import { ORDER_STATUSES, canCancelOrder, formatPrice, totalStock, type OrderStatus } from "@/lib/shop";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).shop.admin.tab, robots: { index: false } } : {};
}

export default async function AdminShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string; status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { denied } = await requireAdminPage(locale, "/admin/tienda");
  if (denied) return denied;
  const dict = getDictionary(locale);
  const s = dict.shop;
  const { view, status } = await searchParams;
  const showProducts = view === "productos";
  const base = href(locale, "/admin/tienda");
  const [orders, products] = await Promise.all([backend.listOrders(), backend.listProducts()]);
  const filter = ORDER_STATUSES.find((x) => x === status) ?? null;
  const shownOrders = orders.filter((o) => !filter || o.status === filter);

  const pill = (active: boolean) =>
    cx(
      "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
      active
        ? "border-navy-700 bg-navy-700 text-white dark:border-ball-500 dark:bg-ball-500 dark:text-navy-950"
        : "border-line text-fg-muted hover:text-fg",
    );

  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{dict.admin.title}</h1>
      <p className="mb-6 mt-2 text-fg-muted">{s.subtitle}</p>
      <AdminTabs locale={locale} active="shop" dict={dict} />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-2">
          <Link href={base} className={pill(!showProducts)}>
            {s.admin.orders} <span className="opacity-70">{orders.filter((o) => o.status === "pending").length}</span>
          </Link>
          <Link href={`${base}?view=productos`} className={pill(showProducts)}>
            {s.admin.products} <span className="opacity-70">{products.length}</span>
          </Link>
        </nav>
        {showProducts && (
          <ButtonLink href={href(locale, "/admin/tienda/producto/nuevo")}>
            <Plus className="size-4" /> {s.admin.newProduct}
          </ButtonLink>
        )}
      </div>

      {showProducts ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const stock = totalStock(p);
                return (
                  <tr key={p.id} className={cx(!p.active && "opacity-60")}>
                    <td className="w-16 px-4 py-3">
                      <div className="w-12 overflow-hidden rounded-lg border border-line">
                        <ProductArt product={p} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-fg-muted">
                        {p.brand} · {s.categories[p.category]}
                        {!p.active && ` · ${s.admin.hidden}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPrice(locale, p.price)}</td>
                    <td className={cx("px-4 py-3 text-right tabular-nums", stock === 0 && "font-semibold text-red-600 dark:text-red-300")}>
                      {s.admin.stock}: {stock}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={href(locale, `/admin/tienda/producto/${p.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-semibold hover:bg-bg-soft"
                      >
                        <Pencil className="size-3.5" /> {s.admin.edit}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <nav className="mb-6 flex flex-wrap gap-2">
            {[null, ...ORDER_STATUSES].map((x) => (
              <Link key={x ?? "all"} href={x ? `${base}?status=${x}` : base} className={pill(x === filter)}>
                {x ? s.orders.status[x] : dict.academy.admin.all}{" "}
                <span className="opacity-70">{x ? orders.filter((o) => o.status === x).length : orders.length}</span>
              </Link>
            ))}
          </nav>
          {shownOrders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-10 text-center text-fg-muted">{s.admin.noOrders}</p>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {shownOrders.map((o) => (
                <li key={o.id}>
                  <Card className="h-full">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-lg font-bold tracking-wider">{o.code}</p>
                        <p className="text-sm font-medium">{o.userName}</p>
                        <a href={`mailto:${o.userEmail}`} className="inline-flex items-center gap-1 text-xs text-fg-muted hover:underline">
                          <Mail className="size-3" /> {o.userEmail}
                        </a>
                      </div>
                      <div className="text-right">
                        <OrderStatusBadge status={o.status} label={s.orders.status[o.status]} />
                        <p className="mt-1 text-xs text-fg-muted">{formatDate(locale, o.createdAt.slice(0, 10))}</p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
                      {o.items.map((item) => (
                        <li key={`${item.productId}-${item.size}`} className="flex justify-between gap-3">
                          <span>
                            {item.quantity} × {item.name}
                            {item.size && <span className="text-fg-muted"> · {item.size}</span>}
                          </span>
                          <span className="tabular-nums">{formatPrice(locale, item.unitPrice * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                      <span className="font-display text-lg font-extrabold">{formatPrice(locale, o.total)}</span>
                      <div className="flex flex-wrap gap-2">
                        {(["ready", "collected"] as OrderStatus[])
                          .filter((next) => (o.status === "pending" ? true : o.status === "ready" && next === "collected"))
                          .map((next) => (
                            <form key={next} action={setOrderStatusAction}>
                              <input type="hidden" name="orderId" value={o.id} />
                              <input type="hidden" name="status" value={next} />
                              <button
                                type="submit"
                                className="rounded-full bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-600"
                              >
                                {next === "ready" ? s.admin.markReady : s.admin.markCollected}
                              </button>
                            </form>
                          ))}
                        {canCancelOrder(o) && (
                          <form action={cancelOrderAction}>
                            <input type="hidden" name="orderId" value={o.id} />
                            <ConfirmSubmit
                              message={s.admin.confirmCancel}
                              className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fg-muted hover:text-red-600"
                            >
                              {s.admin.cancel}
                            </ConfirmSubmit>
                          </form>
                        )}
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Container>
  );
}
