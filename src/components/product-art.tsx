import type { Product } from "@/lib/shop";
import { cx } from "./ui";

/** Tono estable por producto, para que cada ilustración tenga su color. */
function hue(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

/** Foto del producto o, si no tiene, una ilustración de su categoría. */
export function ProductArt({ product, className }: { product: Product; className?: string }) {
  if (product.imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa elegida por el admin
      <img src={product.imageUrl} alt={product.name} className={cx("aspect-square w-full object-cover", className)} />
    );
  }
  const h = hue(product.id);
  const accent = `hsl(${h} 70% 55%)`;
  return (
    <div
      role="img"
      aria-label={product.name}
      className={cx("flex aspect-square w-full items-center justify-center", className)}
      style={{ background: `linear-gradient(145deg, hsl(${h} 60% 94%), hsl(${(h + 40) % 360} 55% 84%))` }}
    >
      <svg viewBox="0 0 100 100" className="h-3/5 w-3/5 drop-shadow-md" aria-hidden>
        {product.category === "palas" && (
          <g>
            <rect x="45" y="62" width="10" height="32" rx="4" fill="#0a2f6d" />
            {product.shape === "diamante" ? (
              <path d="M50 4 L82 30 L74 64 L26 64 L18 30 Z" fill="#0a2f6d" />
            ) : product.shape === "lagrima" ? (
              <path d="M50 4 C76 4 84 26 80 44 C76 58 62 66 50 66 C38 66 24 58 20 44 C16 26 24 4 50 4 Z" fill="#0a2f6d" />
            ) : (
              <ellipse cx="50" cy="34" rx="31" ry="31" fill="#0a2f6d" />
            )}
            {[0, 1, 2, 3].flatMap((r) =>
              [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={35 + c * 10} cy={20 + r * 10} r="2.6" fill={accent} />),
            )}
          </g>
        )}
        {product.category === "zapatillas" && (
          <g>
            <path d="M10 60 C10 46 22 40 34 38 L46 26 C52 22 58 26 60 32 L64 44 C74 46 88 50 90 60 L90 66 L10 66 Z" fill="#0a2f6d" />
            <rect x="8" y="66" width="84" height="8" rx="4" fill={accent} />
            <path d="M44 34 L54 40 M40 40 L50 46 M36 46 L46 52" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {product.category === "ropa" && (
          <g>
            <path d="M34 12 L20 18 L6 36 L18 46 L26 38 L26 90 L74 90 L74 38 L82 46 L94 36 L80 18 L66 12 C62 20 38 20 34 12 Z" fill="#0a2f6d" />
            <path d="M26 56 L74 56" stroke={accent} strokeWidth="6" />
          </g>
        )}
        {product.category === "accesorios" && (
          <g>
            <circle cx="50" cy="50" r="34" fill={accent} />
            <path d="M22 32 C38 42 38 58 22 68 M78 32 C62 42 62 58 78 68" stroke="white" strokeWidth="4" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
}
