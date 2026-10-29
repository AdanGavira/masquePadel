import type { MetadataRoute } from "next";
import { backend } from "@/lib/data";
import { locales } from "@/lib/i18n/config";
import { LEGAL_DOCS } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";

// Se genera en cada petición: incluye torneos y productos actuales.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tournaments, products] = await Promise.all([backend.listTournaments(), backend.listProducts()]);
  const paths = [
    "",
    "/reservas",
    "/academia",
    "/torneos",
    "/torneos/ranking",
    "/tienda",
    ...tournaments.map((t) => `/torneos/${t.id}`),
    ...products.filter((p) => p.active).map((p) => `/tienda/${p.id}`),
    ...LEGAL_DOCS.map((d) => `/legal/${d}`),
  ];
  return paths.map((path) => ({
    url: `${SITE_URL}/es${path}`,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path}`])) },
    changeFrequency: path === "" || path.startsWith("/torneos") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/reservas" ? 0.9 : 0.6,
  }));
}
