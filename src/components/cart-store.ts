"use client";

import { useSyncExternalStore } from "react";
import { MAX_CART_LINES, MAX_QUANTITY, type CartLine } from "@/lib/shop";

/**
 * Carrito guardado en el navegador (localStorage). Es solo una comodidad:
 * el servidor vuelve a comprobar productos, precios y stock al hacer el pedido.
 */

const KEY = "mp_cart";
const EVENT = "mp-cart";
const EMPTY: CartLine[] = [];

let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedLines;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedLines = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cachedLines = EMPTY;
  }
  return cachedLines;
}

export function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines.slice(0, MAX_CART_LINES)));
  } catch {
    // Sin almacenamiento (modo privado): el carrito simplemente no se guarda.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(line: CartLine) {
  const lines = read();
  const existing = lines.find((l) => l.productId === line.productId && l.size === line.size);
  const next = existing
    ? lines.map((l) => (l === existing ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + line.quantity) } : l))
    : [...lines, line];
  writeCart(next);
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
