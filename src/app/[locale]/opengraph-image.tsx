import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDictionary, isLocale } from "@/lib/i18n";

/** Imagen para compartir en WhatsApp y redes, generada con los colores del club. */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "masquePadel";

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : "es");
  const logo = await readFile(path.join(process.cwd(), "public/img/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: 80,
          background: "linear-gradient(135deg, #030f26 0%, #0a2f6d 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <img src={logoSrc} width={280} height={280} alt="" style={{ borderRadius: 999, background: "white" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 30, color: "#ffd23f", fontWeight: 700 }}>{dict.home.hero.eyebrow}</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{dict.home.hero.title}</div>
          <div style={{ fontSize: 30, color: "#b3c7ea" }}>
            {locale === "en" ? "Courts · Academy · Tournaments · Shop" : "Pistas · Academia · Torneos · Tienda"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
