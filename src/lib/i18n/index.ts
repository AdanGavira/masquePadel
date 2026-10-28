import type { Locale } from "./config";
import en from "./dictionaries/en";
import es, { type Dictionary } from "./dictionaries/es";

export * from "./config";
export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Sustituye {clave} en un texto: t("Hola {name}", { name: "Ana" }). */
export function t(text: string, values: Record<string, string | number> = {}) {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}

/** "2026-07-15" → "mié 15 jul" / "Wed 15 Jul". */
export function formatDate(locale: Locale, date: string, opts: Intl.DateTimeFormatOptions = {}) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    ...opts,
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
