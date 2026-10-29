import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/es/admin", "/en/admin", "/es/mis-reservas", "/en/mis-reservas", "/es/tienda/carrito", "/en/tienda/carrito"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
