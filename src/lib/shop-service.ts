import "server-only";
import { backend, type PlaceOrderResult, type User } from "./data";
import {
  MAX_CART_LINES,
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  RACKET_LEVELS,
  RACKET_SHAPES,
  SIZES,
  canCancelOrder,
  parseEuros,
  priceCart,
  type CartLine,
  type OrderStatus,
  type ProductCategory,
  type RacketLevel,
  type RacketShape,
} from "./shop";

/** Reglas de la tienda, comunes a cualquier backend. */

/** Normaliza lo que llega del navegador; el carrito vive en el cliente y no es de fiar. */
function parseLines(raw: unknown): CartLine[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_CART_LINES) return null;
  const lines: CartLine[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { productId, size, quantity } = item as Record<string, unknown>;
    if (typeof productId !== "string" || typeof size !== "string" || typeof quantity !== "number") return null;
    lines.push({ productId, size, quantity });
  }
  return lines;
}

export async function checkout(user: User | null, raw: unknown): Promise<PlaceOrderResult | { ok: false; error: "auth" }> {
  if (!user) return { ok: false, error: "auth" };
  const lines = parseLines(raw);
  if (!lines) return { ok: false, error: "invalid" };
  // Comprobación previa con mensajes claros; el backend vuelve a comprobar el stock al descontarlo.
  const priced = priceCart(lines, await backend.listProducts());
  if (!priced.ok) return priced;
  return backend.placeOrder(user, lines);
}

export async function cancelOrder(user: User | null, id: string): Promise<boolean> {
  if (!user) return false;
  const order = await backend.getOrder(id);
  if (!order || !canCancelOrder(order) || (order.userId !== user.id && user.role !== "admin")) return false;
  await backend.updateOrderStatus(id, "cancelled");
  return true;
}

export async function setOrderStatus(user: User | null, id: string, status: string): Promise<boolean> {
  if (user?.role !== "admin" || !ORDER_STATUSES.includes(status as OrderStatus)) return false;
  const order = await backend.getOrder(id);
  if (!order || order.status === "cancelled") return false;
  await backend.updateOrderStatus(id, status as OrderStatus);
  return true;
}


export type ProductFormError = "forbidden" | "fields" | "price" | "image";

export async function saveProduct(
  user: User | null,
  form: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: ProductFormError }> {
  if (user?.role !== "admin") return { ok: false, error: "forbidden" };
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const id = text("id") || undefined;
  const category = text("category") as ProductCategory;
  const name = text("name");
  const brand = text("brand");
  const descriptionEs = text("descriptionEs");
  const descriptionEn = text("descriptionEn");
  if (
    !PRODUCT_CATEGORIES.includes(category) ||
    name.length < 2 ||
    name.length > 80 ||
    !brand ||
    brand.length > 40 ||
    descriptionEs.length > 600 ||
    descriptionEn.length > 600
  ) {
    return { ok: false, error: "fields" };
  }
  const price = parseEuros(text("price"));
  if (price === null) return { ok: false, error: "price" };
  const imageUrl = text("imageUrl") || null;
  if (imageUrl && !/^https:\/\/\S+$/.test(imageUrl)) return { ok: false, error: "image" };

  const variants = SIZES[category].map((size) => {
    const stock = Number(text(`stock_${size || "unico"}`) || 0);
    return { size, stock: Number.isInteger(stock) && stock >= 0 && stock <= 999 ? stock : -1 };
  });
  if (variants.some((v) => v.stock < 0)) return { ok: false, error: "fields" };

  const shape = category === "palas" && RACKET_SHAPES.includes(text("shape") as RacketShape) ? (text("shape") as RacketShape) : null;
  const level = category === "palas" && RACKET_LEVELS.includes(text("level") as RacketLevel) ? (text("level") as RacketLevel) : null;

  if (id && !(await backend.getProduct(id))) return { ok: false, error: "fields" };
  const product = await backend.saveProduct(
    { name, brand, category, descriptionEs, descriptionEn, price, variants, shape, level, imageUrl, active: form.get("active") === "on" },
    id,
  );
  return { ok: true, id: product.id };
}
