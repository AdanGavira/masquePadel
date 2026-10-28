import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { cx } from "./ui";

export function AdminTabs({
  locale,
  active,
  dict,
}: {
  locale: Locale;
  active: "bookings" | "academy";
  dict: Dictionary["academy"]["admin"];
}) {
  const tabs = [
    { id: "bookings", label: dict.bookingsTab, href: href(locale, "/admin") },
    { id: "academy", label: dict.academyTab, href: href(locale, "/admin/academia") },
  ] as const;
  return (
    <nav aria-label="Panel" className="mb-8 flex gap-1 border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === active ? "page" : undefined}
          className={cx(
            "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
            tab.id === active ? "border-ball-500 text-fg" : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
