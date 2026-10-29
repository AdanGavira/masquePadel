import { describe, expect, it } from "vitest";
import { formatPrice, orderCode, parseEuros, priceCart, type Product } from "./shop";

const product = (id: string, price: number, variants: [string, number][], active = true): Product => ({
  id,
  name: id,
  brand: "Test",
  category: variants[0][0] ? "ropa" : "accesorios",
  descriptionEs: "",
  descriptionEn: "",
  price,
  variants: variants.map(([size, stock]) => ({ size, stock })),
  shape: null,
  level: null,
  imageUrl: null,
  active,
});

const catalog = [product("camiseta", 2495, [["M", 3], ["L", 0]]), product("pelotas", 595, [["", 10]]), product("vieja", 100, [["", 5]], false)];

describe("priceCart", () => {
  it("calcula el total en céntimos con los precios del catálogo", () => {
    const result = priceCart(
      [
        { productId: "camiseta", size: "M", quantity: 2 },
        { productId: "pelotas", size: "", quantity: 3 },
      ],
      catalog,
    );
    expect(result).toMatchObject({ ok: true, total: 2495 * 2 + 595 * 3 });
  });

  it("rechaza falta de stock, tallas inexistentes, productos inactivos y cantidades raras", () => {
    expect(priceCart([{ productId: "camiseta", size: "L", quantity: 1 }], catalog)).toMatchObject({ ok: false, error: "stock" });
    expect(priceCart([{ productId: "camiseta", size: "XXL", quantity: 1 }], catalog)).toMatchObject({ ok: false, error: "invalid" });
    expect(priceCart([{ productId: "vieja", size: "", quantity: 1 }], catalog)).toMatchObject({ ok: false, error: "invalid" });
    expect(priceCart([{ productId: "pelotas", size: "", quantity: 0 }], catalog)).toMatchObject({ ok: false, error: "invalid" });
    expect(priceCart([{ productId: "pelotas", size: "", quantity: 1.5 }], catalog)).toMatchObject({ ok: false, error: "invalid" });
    expect(priceCart([], catalog)).toMatchObject({ ok: false, error: "empty" });
  });

  it("no acepta la misma línea dos veces", () => {
    const line = { productId: "pelotas", size: "", quantity: 1 };
    expect(priceCart([line, line], catalog)).toMatchObject({ ok: false, error: "invalid" });
  });
});

describe("formato", () => {
  it("muestra euros según el idioma", () => {
    expect(formatPrice("es", 21995).replace(/\s/g, " ")).toBe("219,95 €");
    expect(formatPrice("en", 21995)).toBe("€219.95");
  });

  it("convierte precios escritos a mano en céntimos", () => {
    expect(parseEuros("219,95")).toBe(21995);
    expect(parseEuros("219.9")).toBe(21990);
    expect(parseEuros("5")).toBe(500);
    expect(parseEuros("-3")).toBeNull();
    expect(parseEuros("abc")).toBeNull();
  });

  it("genera códigos de recogida sin caracteres ambiguos", () => {
    const code = orderCode();
    expect(code).toMatch(/^MP-[A-HJ-NP-Z2-9]{5}$/);
  });
});
