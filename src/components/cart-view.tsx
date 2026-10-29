"use client";

import { CheckCircle2, LogIn, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkoutAction, type CheckoutState } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { MAX_QUANTITY, formatPrice, stockOf, type Product } from "@/lib/shop";
import { useCart, writeCart } from "./cart-store";
import { ProductArt } from "./product-art";
import { Alert, Button, ButtonLink, Card } from "./ui";

export function CartView({
  locale,
  dict,
  products,
  loggedIn,
  loginHref,
  shopHref,
  myBookingsHref,
  myBookingsLabel,
}: {
  locale: Locale;
  dict: Dictionary["shop"];
  products: Product[];
  loggedIn: boolean;
  loginHref: string;
  shopHref: string;
  myBookingsHref: string;
  myBookingsLabel: string;
}) {
  const lines = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckoutState | null>(null);
  const c = dict.cart;

  if (result?.ok) {
    return (
      <Card className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
        <h2 className="mt-4 font-display text-2xl font-extrabold">{c.successTitle}</h2>
        <p className="mx-auto mt-2 font-mono text-3xl font-bold tracking-widest">{result.code}</p>
        <p className="mx-auto mt-3 max-w-md text-fg-muted">{t(c.successText, { code: result.code })}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={myBookingsHref}>{myBookingsLabel}</ButtonLink>
          <ButtonLink href={shopHref} variant="ghost">
            {c.emptyCta}
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const rows = lines.map((line) => ({ line, product: products.find((p) => p.id === line.productId) ?? null }));
  const valid = rows.filter((r) => r.product);
  const total = valid.reduce((sum, r) => sum + r.product!.price * r.line.quantity, 0);

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-12 text-center">
        <ShoppingBag className="mx-auto size-10 text-fg-muted" />
        <p className="mt-3 text-fg-muted">{c.empty}</p>
        <ButtonLink href={shopHref} className="mt-6">
          {c.emptyCta}
        </ButtonLink>
      </div>
    );
  }

  const update = (index: number, quantity: number) =>
    writeCart(quantity <= 0 ? lines.filter((_, i) => i !== index) : lines.map((l, i) => (i === index ? { ...l, quantity } : l)));

  const checkout = () =>
    startTransition(async () => {
      const response = await checkoutAction(valid.map((r) => r.line));
      setResult(response);
      if (response.ok) {
        writeCart([]);
        router.refresh();
      }
    });

  const errorText =
    result && !result.ok
      ? result.error === "stock"
        ? t(c.errors.stock, { name: products.find((p) => p.id === result.productId)?.name ?? "" })
        : c.errors[result.error]
      : null;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <ul className="divide-y divide-line rounded-2xl border border-line bg-card lg:col-span-2">
        {rows.map(({ line, product }, index) => (
          <li key={`${line.productId}-${line.size}`} className="flex gap-4 p-4">
            {product ? (
              <>
                <div className="w-20 shrink-0 overflow-hidden rounded-xl border border-line sm:w-24">
                  <ProductArt product={product} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">{product.brand}</p>
                      <p className="truncate font-display font-bold">{product.name}</p>
                      {line.size && (
                        <p className="text-sm text-fg-muted">
                          {dict.size}: {line.size}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-semibold">{formatPrice(locale, product.price * line.quantity)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="inline-flex items-center rounded-full border border-line">
                      <button type="button" className="p-2 text-fg-muted hover:text-fg" onClick={() => update(index, line.quantity - 1)} aria-label="−">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        className="p-2 text-fg-muted hover:text-fg disabled:opacity-40"
                        disabled={line.quantity >= Math.min(MAX_QUANTITY, stockOf(product, line.size))}
                        onClick={() => update(index, line.quantity + 1)}
                        aria-label="+"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => update(index, 0)}
                      className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-red-600"
                    >
                      <Trash2 className="size-4" /> {c.remove}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex w-full items-center justify-between text-sm text-fg-muted">
                {c.unavailable}
                <button type="button" onClick={() => update(index, 0)} className="hover:text-red-600">
                  <Trash2 className="size-4" aria-label={c.remove} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Card className="h-fit space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">{c.total}</span>
          <span className="font-display text-2xl font-extrabold">{formatPrice(locale, total)}</span>
        </div>
        <p className="text-sm text-fg-muted">{c.payAtClub}</p>
        {errorText && <Alert>{errorText}</Alert>}
        {loggedIn ? (
          <Button className="w-full py-3" onClick={checkout} disabled={pending || valid.length === 0}>
            {pending ? c.sending : c.checkout}
          </Button>
        ) : (
          <ButtonLink href={loginHref} className="w-full py-3">
            <LogIn className="size-4" /> {c.login}
          </ButtonLink>
        )}
        <Link href={shopHref} className="block text-center text-sm font-semibold text-fg-muted hover:text-fg">
          {dict.back}
        </Link>
      </Card>
    </div>
  );
}
