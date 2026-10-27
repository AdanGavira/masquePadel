export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Ruta con prefijo de idioma: href("en", "/reservas") → "/en/reservas". */
export function href(locale: Locale, path = "/") {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
