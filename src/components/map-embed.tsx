"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui";

/**
 * El mapa de Google instala cookies de terceros, así que no se carga hasta que
 * el visitante lo pide. Así la web no necesita banner de consentimiento.
 */
export function MapEmbed({
  query,
  title,
  loadLabel,
  notice,
  cookiesHref,
  cookiesLabel,
}: {
  query: string;
  title: string;
  loadLabel: string;
  notice: string;
  cookiesHref: string;
  cookiesLabel: string;
}) {
  const [loaded, setLoaded] = useState(false);
  if (loaded) {
    return (
      <iframe
        title={title}
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
        className="h-80 w-full sm:h-96"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }
  return (
    <div className="flex h-80 w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_30%_40%,var(--color-navy-100),transparent_60%),radial-gradient(circle_at_70%_70%,var(--color-ball-300),transparent_55%)] p-6 text-center dark:bg-[radial-gradient(circle_at_30%_40%,var(--color-navy-800),transparent_60%),radial-gradient(circle_at_70%_70%,var(--color-navy-700),transparent_55%)] sm:h-96">
      <MapPin className="size-10 text-navy-700 dark:text-ball-400" />
      <Button variant="secondary" onClick={() => setLoaded(true)}>
        {loadLabel}
      </Button>
      <p className="max-w-xs text-xs text-fg-muted">
        {notice}{" "}
        <Link href={cookiesHref} className="underline underline-offset-2">
          {cookiesLabel}
        </Link>
      </p>
    </div>
  );
}
