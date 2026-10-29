import Link from "next/link";
import { href, type Dictionary, type Locale } from "@/lib/i18n";
import { cx } from "./ui";

export function AdminTabs({
  locale,
  active,
  dict,
}: {
  locale: Locale;
  active: "bookings" | "academy" | "tournaments" | "shop";
  dict: Dictionary;
}) {
  const tabs = [
    { id: "bookings", label: dict.academy.admin.bookingsTab, href: href(locale, "/admin") },
    { id: "academy", label: dict.academy.admin.academyTab, href: href(locale, "/admin/academia") },
    { id: "tournaments", label: dict.tournaments.admin.tab, href: href(locale, "/admin/torneos") },
    { id: "shop", label: dict.shop.admin.tab, href: href(locale, "/admin/tienda") },
  ] as const;
  return (
    <nav aria-label="Panel" className="-mx-4 mb-8 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === active ? "page" : undefined}
          className={cx(
            "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
            tab.id === active ? "border-ball-500 text-fg" : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
