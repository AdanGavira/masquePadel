"use client";

import { CalendarCheck, LayoutDashboard, LogOut, Menu, Moon, ShoppingCart, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction, setLocaleCookie } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import { href, locales } from "@/lib/i18n/config";
import { useCart } from "./cart-store";
import { cx } from "./ui";

interface NavLink {
  href: string;
  label: string;
  soon?: boolean;
}

export function HeaderNav({
  locale,
  dict,
  links,
  user,
}: {
  locale: Locale;
  dict: Dictionary["nav"];
  links: NavLink[];
  user: { name: string; isAdmin: boolean } | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (link: NavLink) => !link.soon && (pathname === link.href || pathname.startsWith(`${link.href}/`));
  const switchTo = locales.find((l) => l !== locale)!;
  const switchPath = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), `/${switchTo}`);

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("mp_theme", next);
    } catch {}
  };

  const iconButton =
    "inline-flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg";

  return (
    <header
      className={cx(
        "sticky top-0 z-40 border-b transition-colors",
        scrolled || open ? "border-line bg-bg/85 backdrop-blur-lg" : "border-transparent bg-bg",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href={href(locale)} className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight">
          <Image src="/img/logo.png" alt="" width={36} height={36} className="rounded-full bg-white" priority />
          <span>
            masque<span className="text-ball-600 dark:text-ball-400">Padel</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link) ? "page" : undefined}
              className={cx(
                "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                isActive(link) ? "bg-bg-soft text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {link.label}
              {link.soon && (
                <span className="ml-1.5 hidden rounded-full bg-ball-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ball-600 xl:inline dark:text-ball-400">
                  {dict.soon}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href={switchPath}
            onClick={() => setLocaleCookie(switchTo)}
            hrefLang={switchTo}
            aria-label={dict.language}
            className={cx(iconButton, "text-xs font-bold uppercase")}
          >
            {switchTo}
          </Link>
          <CartButton href={href(locale, "/tienda/carrito")} label={dict.cart} className={iconButton} />
          <button type="button" onClick={toggleTheme} aria-label={dict.theme} className={iconButton}>
            <Sun className="hidden size-[18px] dark:block" />
            <Moon className="size-[18px] dark:hidden" />
          </button>

          <div className="hidden items-center gap-2 pl-2 lg:flex">
            {user ? (
              <UserLinks locale={locale} dict={dict} user={user} compact />
            ) : (
              <>
                <Link href={href(locale, "/acceso")} className="px-3 py-2 text-sm font-semibold text-fg-muted hover:text-fg">
                  {dict.login}
                </Link>
                <Link
                  href={href(locale, "/reservas")}
                  className="rounded-full bg-ball-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-ball-400"
                >
                  {dict.booking}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className={cx(iconButton, "lg:hidden")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={dict.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line px-4 pb-6 pt-2 lg:hidden">
          <nav aria-label="Principal" className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-line py-3 font-medium"
              >
                {link.label}
                {link.soon && <span className="text-xs font-semibold uppercase text-ball-600">{dict.soon}</span>}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <UserLinks locale={locale} dict={dict} user={user} />
            ) : (
              <>
                <Link
                  href={href(locale, "/reservas")}
                  className="rounded-full bg-ball-500 px-4 py-3 text-center font-semibold text-navy-950"
                >
                  {dict.booking}
                </Link>
                <Link href={href(locale, "/acceso")} className="rounded-full border border-line px-4 py-3 text-center font-semibold">
                  {dict.login}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function UserLinks({
  locale,
  dict,
  user,
  compact = false,
}: {
  locale: Locale;
  dict: Dictionary["nav"];
  user: { name: string; isAdmin: boolean };
  compact?: boolean;
}) {
  // En escritorio estrecho solo se ven los iconos; el texto aparece a partir de xl.
  const label = (text: string) => <span className={compact ? "sr-only whitespace-nowrap xl:not-sr-only" : undefined}>{text}</span>;
  const item =
    "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:bg-bg-soft hover:text-fg";
  return (
    <>
      {user.isAdmin && (
        <Link href={href(locale, "/admin")} className={item}>
          <LayoutDashboard className="size-4" /> {label(dict.admin)}
        </Link>
      )}
      <Link href={href(locale, "/mis-reservas")} className={item}>
        <CalendarCheck className="size-4" /> {label(dict.myBookings)}
      </Link>
      <form action={logoutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className={item} title={user.name}>
          <LogOut className="size-4" /> {label(dict.logout)}
        </button>
      </form>
    </>
  );
}

function CartButton({ href: to, label, className }: { href: string; label: string; className: string }) {
  const count = useCart().reduce((sum, l) => sum + l.quantity, 0);
  return (
    <Link href={to} aria-label={count ? `${label} (${count})` : label} className={cx(className, "relative")}>
      <ShoppingCart className="size-[18px]" />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-ball-500 px-1 text-[10px] font-bold leading-4 text-navy-950">
          {count}
        </span>
      )}
    </Link>
  );
}
