import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SIZES, orderCode, priceCart, type Order, type Product, type ProductCategory, type Variant } from "../shop";
import { cookieOptions, decode, encode } from "./demo-cookies";
import type { Backend } from "./types";

/**
 * Tienda del modo demostración: catálogo de ejemplo con marcas ficticias.
 * Los cambios del administrador y los pedidos del visitante van en su cookie.
 */

const COOKIE = "mp_demo_s";
const MAX_CREATED = 3;
const MAX_ORDERS = 3;

interface ShopState {
  /** Productos creados por el administrador. */
  p: Product[];
  /** Cambios sobre los productos de ejemplo: solo los campos modificados, para que la cookie no crezca. */
  e: Record<string, Partial<Product>>;
  /** Pedidos del visitante. */
  o: Order[];
}

async function readState(): Promise<ShopState> {
  const s = decode<Partial<ShopState>>((await cookies()).get(COOKIE)?.value) ?? {};
  return { p: s.p ?? [], e: s.e ?? {}, o: s.o ?? [] };
}

async function writeState(s: ShopState) {
  s.p = s.p.slice(-MAX_CREATED);
  s.o = s.o.slice(-MAX_ORDERS);
  (await cookies()).set(COOKIE, encode(s), cookieOptions());
}

/** Stock de ejemplo por talla: más en las tallas centrales. */
function stockFor(category: ProductCategory, base: number): Variant[] {
  const sizes = SIZES[category];
  return sizes.map((size, i) => {
    const middle = (sizes.length - 1) / 2;
    const stock = sizes.length === 1 ? base : Math.max(0, Math.round(base - Math.abs(i - middle) * 1.5));
    return { size, stock };
  });
}

type Seed = Omit<Product, "id" | "variants" | "imageUrl" | "active" | "shape" | "level"> &
  Partial<Pick<Product, "shape" | "level">> & { id: string; stock: number };

const SEEDS: Seed[] = [
  {
    id: "pala-vertice-carbon-pro",
    name: "Carbon Pro 18K",
    brand: "Vértice",
    category: "palas",
    price: 21995,
    stock: 4,
    shape: "diamante",
    level: "avanzado",
    descriptionEs: "Pala de potencia con caras de carbono 18K y núcleo EVA duro. Balance alto para remates definitivos.",
    descriptionEn: "Power racket with 18K carbon faces and a hard EVA core. High balance for finishing smashes.",
  },
  {
    id: "pala-vertice-control",
    name: "Control 3K",
    brand: "Vértice",
    category: "palas",
    price: 14995,
    stock: 6,
    shape: "redonda",
    level: "intermedio",
    descriptionEs: "Máximo control y punto dulce amplio. Ideal para jugadores de defensa que buscan precisión.",
    descriptionEn: "Maximum control and a large sweet spot. Ideal for defensive players looking for precision.",
  },
  {
    id: "pala-nordika-hybrid",
    name: "Hybrid Tear",
    brand: "Nórdika",
    category: "palas",
    price: 12995,
    stock: 5,
    shape: "lagrima",
    level: "intermedio",
    descriptionEs: "Forma de lágrima con balance medio: el equilibrio perfecto entre potencia y manejabilidad.",
    descriptionEn: "Teardrop shape with medium balance: the perfect mix of power and handling.",
  },
  {
    id: "pala-altamar-start",
    name: "Start",
    brand: "Altamar",
    category: "palas",
    price: 6995,
    stock: 8,
    shape: "redonda",
    level: "iniciacion",
    descriptionEs: "Ligera, cómoda y con goma blanda. La mejor forma de empezar a jugar al pádel.",
    descriptionEn: "Light, comfortable and with a soft core. The best way to start playing padel.",
  },
  {
    id: "zapatillas-nordika-grip",
    name: "Grip Clay",
    brand: "Nórdika",
    category: "zapatillas",
    price: 8995,
    stock: 4,
    descriptionEs: "Suela de espiga para césped artificial con arena. Agarre y estabilidad en los cambios de dirección.",
    descriptionEn: "Herringbone sole for sand-filled artificial grass. Grip and stability when changing direction.",
  },
  {
    id: "zapatillas-altamar-court",
    name: "Court Lite",
    brand: "Altamar",
    category: "zapatillas",
    price: 6495,
    stock: 3,
    descriptionEs: "Zapatilla ligera y transpirable con amortiguación en el talón para jugar muchas horas.",
    descriptionEn: "Light, breathable shoe with heel cushioning for long hours on court.",
  },
  {
    id: "camiseta-masquepadel",
    name: "Camiseta técnica Club",
    brand: "masquePadel",
    category: "ropa",
    price: 2495,
    stock: 6,
    descriptionEs: "Camiseta oficial del club en tejido técnico de secado rápido.",
    descriptionEn: "Official club T-shirt in quick-dry technical fabric.",
  },
  {
    id: "pantalon-dry",
    name: "Pantalón corto Dry",
    brand: "Nórdika",
    category: "ropa",
    price: 2995,
    stock: 5,
    descriptionEs: "Pantalón corto elástico con bolsillos para las bolas.",
    descriptionEn: "Stretch shorts with ball pockets.",
  },
  {
    id: "falda-ace",
    name: "Falda pantalón Ace",
    brand: "Altamar",
    category: "ropa",
    price: 3295,
    stock: 4,
    descriptionEs: "Falda con malla interior y cintura ancha para máxima libertad de movimiento.",
    descriptionEn: "Skort with inner shorts and a wide waistband for full freedom of movement.",
  },
  {
    id: "pelotas-pro",
    name: "Bote de pelotas Pro (3 uds)",
    brand: "Vértice",
    category: "accesorios",
    price: 595,
    stock: 40,
    descriptionEs: "Pelotas presurizadas de bote regular, aprobadas para competición.",
    descriptionEn: "Pressurised balls with a consistent bounce, approved for competition.",
  },
  {
    id: "overgrips",
    name: "Overgrips (pack de 3)",
    brand: "Nórdika",
    category: "accesorios",
    price: 795,
    stock: 25,
    descriptionEs: "Overgrips perforados, finos y absorbentes. Colores variados.",
    descriptionEn: "Thin, absorbent perforated overgrips. Assorted colours.",
  },
  {
    id: "paletero-tour",
    name: "Paletero Tour",
    brand: "masquePadel",
    category: "accesorios",
    price: 5495,
    stock: 0,
    descriptionEs: "Paletero con compartimento térmico para dos palas y bolsillo para zapatillas.",
    descriptionEn: "Racket bag with a thermal compartment for two rackets and a shoe pocket.",
  },
  {
    id: "munequeras",
    name: "Muñequeras (2 uds)",
    brand: "masquePadel",
    category: "accesorios",
    price: 695,
    stock: 15,
    descriptionEs: "Muñequeras de rizo con el logo del club.",
    descriptionEn: "Terry wristbands with the club logo.",
  },
];

const seededProducts: Product[] = SEEDS.map(({ stock, shape, level, ...p }) => ({
  ...p,
  shape: shape ?? null,
  level: level ?? null,
  imageUrl: null,
  active: true,
  variants: stockFor(p.category, stock),
}));

function allProducts(s: ShopState): Product[] {
  return [...seededProducts.map((p) => ({ ...p, ...s.e[p.id] })), ...s.p];
}

/** Aplica un cambio a un producto, guardándolo donde corresponda. */
function putProduct(s: ShopState, product: Product) {
  const created = s.p.findIndex((p) => p.id === product.id);
  const seed = seededProducts.find((p) => p.id === product.id);
  if (created >= 0) s.p[created] = product;
  else if (seed) {
    const keys = Object.keys(product) as (keyof Product)[];
    const diff = keys.filter((k) => JSON.stringify(product[k]) !== JSON.stringify(seed[k]));
    s.e[product.id] = Object.fromEntries(diff.map((k) => [k, product[k]]));
  } else s.p.push(product);
}

function adjustStock(s: ShopState, productId: string, size: string, delta: number) {
  const product = allProducts(s).find((p) => p.id === productId);
  if (!product) return;
  putProduct(s, {
    ...product,
    variants: product.variants.map((v) => (v.size === size ? { ...v, stock: Math.max(0, v.stock + delta) } : v)),
  });
}

type ShopMethods = Pick<
  Backend,
  "listProducts" | "getProduct" | "saveProduct" | "placeOrder" | "listUserOrders" | "listOrders" | "getOrder" | "updateOrderStatus"
>;

export const demoShop: ShopMethods = {
  async listProducts() {
    return allProducts(await readState());
  },

  async getProduct(id) {
    return allProducts(await readState()).find((p) => p.id === id) ?? null;
  },

  async saveProduct(input, id) {
    const s = await readState();
    const product: Product = { ...input, id: id ?? `prod-${randomBytes(5).toString("hex")}` };
    putProduct(s, product);
    await writeState(s);
    return product;
  },

  async placeOrder(user, lines) {
    const s = await readState();
    const priced = priceCart(lines, allProducts(s));
    if (!priced.ok) return priced;
    for (const item of priced.items) adjustStock(s, item.productId, item.size, -item.quantity);
    const order: Order = {
      id: `ord-${randomBytes(5).toString("hex")}`,
      code: orderCode(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      items: priced.items,
      total: priced.total,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    s.o.push(order);
    await writeState(s);
    return { ok: true, order };
  },

  async listUserOrders(userId) {
    return (await readState()).o.filter((o) => o.userId === userId).reverse();
  },

  async listOrders() {
    return [...(await readState()).o].reverse();
  },

  async getOrder(id) {
    return (await readState()).o.find((o) => o.id === id) ?? null;
  },

  async updateOrderStatus(id, status) {
    const s = await readState();
    const order = s.o.find((o) => o.id === id);
    if (!order) return;
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) adjustStock(s, item.productId, item.size, item.quantity);
    }
    order.status = status;
    await writeState(s);
  },
};
