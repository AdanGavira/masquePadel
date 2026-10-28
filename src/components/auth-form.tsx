"use client";

import Link from "next/link";
import { useRef } from "react";
import { loginAction, registerAction, type FormState } from "@/app/actions";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Alert, Button } from "./ui";
import { useFormAction } from "./use-form-action";

const input =
  "mt-1.5 block w-full rounded-xl border border-line bg-bg px-4 py-3 text-fg outline-none transition-colors placeholder:text-fg-muted/60 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20";

export function AuthForm({
  mode,
  locale,
  next,
  dict,
  altHref,
  demoAccounts,
}: {
  mode: "login" | "register";
  locale: Locale;
  next?: string;
  dict: Dictionary["auth"];
  altHref: string;
  demoAccounts?: { label: string; email: string; password: string }[];
}) {
  const [state, onSubmit, pending] = useFormAction<FormState>(mode === "login" ? loginAction : registerAction);
  const formRef = useRef<HTMLFormElement>(null);

  const fillDemo = (email: string, password: string) => {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = email;
    (form.elements.namedItem("password") as HTMLInputElement).value = password;
  };

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}

        {state?.error && <Alert>{dict.errors[state.error]}</Alert>}
        {state?.notice === "confirm" && <Alert tone="success">{dict.confirmEmail}</Alert>}

        {mode === "register" && (
          <label className="block text-sm font-medium">
            {dict.name}
            <input name="name" required maxLength={80} autoComplete="name" className={input} />
          </label>
        )}
        <label className="block text-sm font-medium">
          {dict.email}
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="block text-sm font-medium">
          {dict.password}
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={input}
          />
          {mode === "register" && <span className="mt-1 block text-xs text-fg-muted">{dict.passwordHint}</span>}
        </label>

        <Button type="submit" className="w-full py-3" disabled={pending}>
          {mode === "login" ? dict.login : dict.register}
        </Button>
      </form>

      <p className="text-center text-sm text-fg-muted">
        {mode === "login" ? dict.noAccount : dict.hasAccount}{" "}
        <Link href={altHref} className="font-semibold text-navy-600 underline-offset-2 hover:underline dark:text-ball-400">
          {mode === "login" ? dict.register : dict.login}
        </Link>
      </p>

      {demoAccounts && (
        <div className="rounded-2xl border border-dashed border-ball-500/60 bg-ball-400/10 p-5">
          <p className="text-sm font-semibold">{dict.demoTitle}</p>
          <p className="mt-1 text-xs text-fg-muted">{dict.demoText}</p>
          <ul className="mt-4 space-y-2">
            {demoAccounts.map((acc) => (
              <li key={acc.email} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="font-semibold">{acc.label}</span>
                  <span className="block font-mono text-xs text-fg-muted">
                    {acc.email} · {acc.password}
                  </span>
                </span>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => fillDemo(acc.email, acc.password)}
                    className="rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold hover:bg-bg-soft"
                  >
                    {dict.useAccount}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
