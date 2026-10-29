"use client";

import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { MAX_QUANTITY, type Variant } from "@/lib/shop";
import { addToCart } from "./cart-store";
import { Button, cx } from "./ui";

export function AddToCart({
  productId,
  variants,
  withSizes,
  cartHref,
  dict,
}: {
  productId: string;
  variants: Variant[];
  withSizes: boolean;
  cartHref: string;
  dict: Dictionary["shop"];
}) {
  const [size, setSize] = useState<string | null>(withSizes ? null : variants[0]?.size ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const stock = variants.find((v) => v.size === size)?.stock ?? 0;
  const soldOut = variants.every((v) => v.stock === 0);
  const max = Math.min(MAX_QUANTITY, stock);

  return (
    <div className="mt-8 space-y-5">
      {withSizes && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{dict.chooseSize}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.size}
                type="button"
                disabled={v.stock === 0}
                aria-pressed={size === v.size}
                onClick={() => {
                  setSize(v.size);
                  setQuantity(1);
                  setAdded(false);
                }}
                className={cx(
                  "min-w-12 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  size === v.size
                    ? "border-navy-700 bg-navy-700 text-white dark:border-ball-500 dark:bg-ball-500 dark:text-navy-950"
                    : "border-line hover:border-navy-300",
                  v.stock === 0 && "cursor-not-allowed text-fg-muted line-through opacity-50",
                )}
              >
                {v.size}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {size !== null && (
        <p className={cx("text-sm font-semibold", stock === 0 ? "text-fg-muted" : stock <= 2 ? "text-ball-600 dark:text-ball-400" : "text-emerald-700 dark:text-emerald-400")}>
          {stock === 0 ? dict.outOfStock : stock <= 2 ? dict.lowStock : dict.inStock}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-line" aria-label={dict.quantity}>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 text-fg-muted hover:text-fg disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="−"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            className="p-3 text-fg-muted hover:text-fg disabled:opacity-40"
            disabled={quantity >= max}
            aria-label="+"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          className="flex-1 py-3"
          disabled={soldOut || size === null || stock === 0}
          onClick={() => {
            addToCart({ productId, size: size!, quantity });
            setAdded(true);
          }}
        >
          <ShoppingCart className="size-4" /> {soldOut ? dict.outOfStock : withSizes && size === null ? dict.chooseSize : dict.add}
        </Button>
      </div>

      {added && (
        <p role="status" className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" /> {dict.added} ·{" "}
          <Link href={cartHref} className="underline underline-offset-2">
            {dict.viewCart}
          </Link>
        </p>
      )}
    </div>
  );
}
