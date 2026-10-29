"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveProductAction, type ProductFormState } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  PRODUCT_CATEGORIES,
  RACKET_LEVELS,
  RACKET_SHAPES,
  SIZES,
  stockOf,
  type Product,
  type ProductCategory,
} from "@/lib/shop";
import { Alert, Button, cx } from "./ui";
import { useFormAction } from "./use-form-action";

const input =
  "mt-1.5 block w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20";
const label = "block text-sm font-medium";

export function ProductForm({ product, dict, locale }: { product: Product | null; dict: Dictionary["shop"]; locale: Locale }) {
  const a = dict.admin;
  const router = useRouter();
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "palas");
  const [state, onSubmit, pending] = useFormAction<ProductFormState>(saveProductAction);

  useEffect(() => {
    if (state?.ok && !product) router.replace(`/${locale}/admin/tienda/producto/${state.id}`);
  }, [state, product, router, locale]);

  const price = product ? (product.price / 100).toFixed(2).replace(".", locale === "es" ? "," : ".") : "";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      {state?.ok && <Alert tone="success">{a.form.saved}</Alert>}
      {state && !state.ok && <Alert>{a.errors[state.error]}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {a.form.name}
          <input name="name" required minLength={2} maxLength={80} defaultValue={product?.name} className={input} />
        </label>
        <label className={label}>
          {a.form.brand}
          <input name="brand" required maxLength={40} defaultValue={product?.brand} className={input} />
        </label>
        <label className={label}>
          {a.form.category}
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className={input}
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {dict.categories[c]}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {a.form.price}
          <input name="price" required inputMode="decimal" placeholder="49,95" defaultValue={price} className={input} />
        </label>
      </div>

      {category === "palas" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            {dict.shape}
            <select name="shape" defaultValue={product?.shape ?? ""} className={input}>
              <option value="">{a.form.none}</option>
              {RACKET_SHAPES.map((s) => (
                <option key={s} value={s}>
                  {dict.shapes[s]}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            {dict.level}
            <select name="level" defaultValue={product?.level ?? ""} className={input}>
              <option value="">{a.form.none}</option>
              {RACKET_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {dict.levels[l]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <fieldset>
        <legend className={label}>{a.form.stock}</legend>
        <div className={cx("mt-1.5 grid gap-3", SIZES[category].length > 1 ? "grid-cols-3 sm:grid-cols-4" : "max-w-40")}>
          {SIZES[category].map((size) => (
            <label key={`${category}-${size}`} className="block text-xs font-semibold text-fg-muted">
              {size || a.form.oneSize}
              <input
                name={`stock_${size || "unico"}`}
                type="number"
                min={0}
                max={999}
                required
                defaultValue={product && product.category === category ? stockOf(product, size) : 0}
                className={input}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className={label}>
        {a.form.descriptionEs}
        <textarea name="descriptionEs" rows={3} maxLength={600} defaultValue={product?.descriptionEs} className={input} />
      </label>
      <label className={label}>
        {a.form.descriptionEn}
        <textarea name="descriptionEn" rows={3} maxLength={600} defaultValue={product?.descriptionEn} className={input} />
      </label>
      <label className={label}>
        {a.form.imageUrl}
        <input name="imageUrl" type="url" placeholder="https://" defaultValue={product?.imageUrl ?? ""} className={input} />
        <span className="mt-1 block text-xs font-normal text-fg-muted">{a.form.imageHint}</span>
      </label>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="size-4 accent-navy-600" />
        {a.form.active}
      </label>

      <Button type="submit" disabled={pending}>
        {a.form.save}
      </Button>
    </form>
  );
}
