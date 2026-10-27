import Image from "next/image";
import { redirect } from "next/navigation";
import { backend, isSupabaseConfigured } from "@/lib/data";
import { DEMO_ACCOUNTS } from "@/lib/data/demo-backend";
import { getDictionary, href, type Locale } from "@/lib/i18n";
import { AuthForm } from "./auth-form";

export async function AuthPage({ mode, locale, next }: { mode: "login" | "register"; locale: Locale; next?: string }) {
  const dict = getDictionary(locale).auth;
  if (await backend.getCurrentUser()) redirect(href(locale, "/reservas"));

  const altPath = href(locale, mode === "login" ? "/registro" : "/acceso");
  const altHref = next ? `${altPath}?next=${encodeURIComponent(next)}` : altPath;

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <Image src="/img/hero.jpg" alt="" fill sizes="50vw" className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 to-transparent" />
        <Image
          src="/img/logo.png"
          alt="masquePadel"
          width={160}
          height={160}
          className="absolute bottom-12 left-12 rounded-full bg-white shadow-2xl"
        />
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {mode === "login" ? dict.loginTitle : dict.registerTitle}
          </h1>
          <p className="mb-8 mt-2 text-fg-muted">{mode === "login" ? dict.loginSubtitle : dict.registerSubtitle}</p>
          <AuthForm
            mode={mode}
            locale={locale}
            next={next}
            dict={dict}
            altHref={altHref}
            demoAccounts={
              isSupabaseConfigured
                ? undefined
                : [
                    { label: dict.demoPlayer, ...DEMO_ACCOUNTS.player },
                    { label: dict.demoAdmin, ...DEMO_ACCOUNTS.admin },
                  ]
            }
          />
        </div>
      </div>
    </div>
  );
}
