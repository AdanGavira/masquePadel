import "server-only";
import type { Order, Product } from "../shop";
import { client } from "./supabase-client";
import type { Backend } from "./types";

/** Tienda con Supabase. El esquema está en supabase/migrations/0004_tienda.sql. */

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  category: Product["category"];
  description_es: string;
  description_en: string;
  price: number;
  variants: Product["variants"];
  shape: Product["shape"];
  level: Product["level"];
  image_url: string | null;
  active: boolean;
}

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  brand: r.brand,
  category: r.category,
  descriptionEs: r.description_es,
  descriptionEn: r.description_en,
  price: r.price,
  variants: r.variants,
  shape: r.shape,
  level: r.level,
  imageUrl: r.image_url,
  active: r.active,
});

interface OrderRow {
  id: string;
  code: string;
  user_id: string;
  user_name: string;
  user_email: string;
  items: Order["items"];
  total: number;
  status: Order["status"];
  created_at: string;
}

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  code: r.code,
  userId: r.user_id,
  userName: r.user_name,
  userEmail: r.user_email,
  items: r.items,
  total: r.total,
  status: r.status,
  createdAt: r.created_at,
});

type ShopMethods = Pick<
  Backend,
  "listProducts" | "getProduct" | "saveProduct" | "placeOrder" | "listUserOrders" | "listOrders" | "getOrder" | "updateOrderStatus"
>;

export const supabaseShop: ShopMethods = {
  async listProducts() {
    const supabase = await client();
    const { data, error } = await supabase.from("products").select().order("created_at");
    if (error) throw error;
    return data.map(toProduct);
  },

  async getProduct(id) {
    // Los ids de Supabase son UUID: cualquier otro valor no existe.
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const supabase = await client();
    const { data } = await supabase.from("products").select().eq("id", id).maybeSingle();
    return data ? toProduct(data) : null;
  },

  async saveProduct(p, id) {
    const supabase = await client();
    const row = {
      name: p.name,
      brand: p.brand,
      category: p.category,
      description_es: p.descriptionEs,
      description_en: p.descriptionEn,
      price: p.price,
      variants: p.variants,
      shape: p.shape,
      level: p.level,
      image_url: p.imageUrl,
      active: p.active,
    };
    const { data, error } = id
      ? await supabase.from("products").update(row).eq("id", id).select().single()
      : await supabase.from("products").insert(row).select().single();
    if (error) throw error;
    return toProduct(data);
  },

  async placeOrder(_user, lines) {
    const supabase = await client();
    const { data, error } = await supabase.rpc("place_order", { p_items: lines }).single();
    if (error) {
      // P0002: producto o cantidad no válidos. P0003: sin stock. El mensaje trae el id del producto.
      const productId = error.message.split(":")[1];
      if (error.code === "P0003") return { ok: false, error: "stock", productId };
      if (error.code === "P0002") return { ok: false, error: "invalid", productId };
      throw error;
    }
    return { ok: true, order: toOrder(data as OrderRow) };
  },

  async listUserOrders(userId) {
    const supabase = await client();
    const { data, error } = await supabase
      .from("orders")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(toOrder);
  },

  async listOrders() {
    const supabase = await client();
    const { data, error } = await supabase.from("orders").select().order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data.map(toOrder);
  },

  async getOrder(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const supabase = await client();
    const { data } = await supabase.from("orders").select().eq("id", id).maybeSingle();
    return data ? toOrder(data) : null;
  },

  async updateOrderStatus(id, status) {
    const supabase = await client();
    // Cancelar siempre pasa por la función que devuelve el stock.
    const { error } =
      status === "cancelled"
        ? await supabase.rpc("cancel_order", { p_order: id })
        : await supabase.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
  },
};
