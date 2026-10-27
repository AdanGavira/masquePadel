import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

const buttonStyles = {
  primary: "bg-ball-500 text-navy-950 hover:bg-ball-400 shadow-sm shadow-ball-600/20",
  secondary: "bg-navy-700 text-white hover:bg-navy-600 dark:bg-navy-500 dark:hover:bg-navy-400",
  ghost: "border border-line text-fg hover:bg-bg-soft",
  light: "border border-white/30 text-white hover:bg-white/10",
  danger: "border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50",
};

type Variant = keyof typeof buttonStyles;

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ball-500 disabled:cursor-not-allowed disabled:opacity-60";

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(base, buttonStyles[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(base, buttonStyles[variant], className)} {...props} />;
}

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function SectionHeading({ title, subtitle, center }: { title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={cx("mb-10 max-w-2xl", center && "mx-auto text-center")}>
      <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-lg text-fg-muted">{subtitle}</p>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-line bg-card p-6", className)}>{children}</div>;
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const tones = {
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    info: "border-navy-200 bg-navy-50 text-navy-800 dark:border-navy-800 dark:bg-navy-900/40 dark:text-navy-100",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-xl border px-4 py-3 text-sm", tones[tone])}>
      {children}
    </div>
  );
}

export { cx };
