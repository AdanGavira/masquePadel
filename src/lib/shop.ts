/**
 * Tienda: catálogo con stock por talla y pedidos para recoger y pagar en el
 * club. Los precios se guardan en céntimos para evitar errores de redondeo.
 */

export type ProductCategory = "palas" | "zapatillas" | "ropa" | "accesorios";
export const PRODUCT_CATEGORIES: ProductCategory[] = ["palas", "zapatillas", "ropa", "accesorios"];

export type RacketShape = "redonda" | "lagrima" | "diamante";
export type RacketLevel = "iniciacion" | "intermedio" | "avanzado";
export const RACKET_SHAPES: RacketShape[] = ["redonda", "lagrima", "diamante"];
export const RACKET_LEVELS: RacketLevel[] = ["iniciacion", "intermedio", "avanzado"];

/** Tallas por categoría. Las palas y accesorios tienen una única "talla" vacía. */
export const SIZES: Record<ProductCategory, string[]> = {
  palas: [""],
  zapatillas: ["38", "39", "40", "41", "42", "43", "44", "45"],
  ropa: ["XS", "S", "M", "L", "XL", "XXL"],
  accesorios: [""],
};

export interface Variant {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  descriptionEs: string;
  descriptionEn: string;
  /** Precio en céntimos. */
  price: number;
  variants: Variant[];
  shape: RacketShape | null;
  level: RacketLevel | null;
  /** URL de imagen opcional; sin ella se dibuja una ilustración. */
  imageUrl: string | null;
  active: boolean;
}

export type OrderStatus = "pending" | "ready" | "collected" | "cancelled";
export const ORDER_STATUSES: OrderStatus[] = ["pending", "ready", "collected", "cancelled"];

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  /** Precio unitario en céntimos en el momento del pedido. */
  unitPrice: number;
}

export interface Order {
  id: string;
  /** Código corto para recoger el pedido en recepción. */
  code: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CartLine {
  productId: string;
  size: string;
  quantity: number;
}

export const MAX_QUANTITY = 5;
export const MAX_CART_LINES = 10;

export function stockOf(product: Product, size: string) {
  return product.variants.find((v) => v.size === size)?.stock ?? 0;
}

export function totalStock(product: Product) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export function hasSizes(category: ProductCategory) {
  return SIZES[category].some((s) => s !== "");
}

/** Comprueba un carrito contra el catálogo y devuelve las líneas con precio, o el primer problema. */
export function priceCart(
  lines: CartLine[],
  products: Product[],
): { ok: true; items: OrderItem[]; total: number } | { ok: false; error: "empty" | "invalid" | "stock"; productId?: string } {
  if (lines.length === 0) return { ok: false, error: "empty" };
  if (lines.length > MAX_CART_LINES) return { ok: false, error: "invalid" };
  const items: OrderItem[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const key = `${line.productId}|${line.size}`;
    const product = products.find((p) => p.id === line.productId && p.active);
    if (
      !product ||
      seen.has(key) ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_QUANTITY ||
      !product.variants.some((v) => v.size === line.size)
    ) {
      return { ok: false, error: "invalid", productId: line.productId };
    }
    seen.add(key);
    if (stockOf(product, line.size) < line.quantity) return { ok: false, error: "stock", productId: product.id };
    items.push({ productId: product.id, name: product.name, size: line.size, quantity: line.quantity, unitPrice: product.price });
  }
  return { ok: true, items, total: items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) };
}

/** "219,95" o "219.95" → 21995 céntimos. */
export function parseEuros(value: string): number | null {
  const match = /^(\d{1,4})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

export function formatPrice(locale: string, cents: number) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/** Código de recogida legible, sin caracteres que se confundan (0/O, 1/I). */
export function orderCode(random: () => number = Math.random) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `MP-${Array.from({ length: 5 }, () => alphabet[Math.floor(random() * alphabet.length)]).join("")}`;
}

/** Se puede cancelar mientras no se haya recogido. */
export const canCancelOrder = (o: Order) => o.status === "pending" || o.status === "ready";
