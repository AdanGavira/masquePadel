import { ArrowLeft, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryTabs } from "@/components/tournament-ui";
import { Container, cx } from "@/components/ui";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { rankingFor } from "@/lib/tournament-service";
import { CATEGORIES, type Category } from "@/lib/tournaments";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).tournaments.ranking.title } : {};
}

export default async function RankingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const r = dict.tournaments.ranking;
  const { cat } = await searchParams;
  const category: Category = CATEGORIES.includes(cat as Category) ? (cat as Category) : "masculino";
  const ranking = await rankingFor(category);

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <Link href={href(locale, "/torneos")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {dict.tournaments.detail.back}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{r.title}</h1>
      <p className="mb-8 mt-2 text-fg-muted">{r.subtitle}</p>

      <CategoryTabs active={category} hrefFor={(c) => `${href(locale, "/torneos/ranking")}?cat=${c}`} dict={dict} />

      {ranking.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-fg-muted">{r.empty}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead className="bg-bg-soft text-left text-xs uppercase tracking-wider text-fg-muted">
              <tr>
                <th scope="col" className="w-12 px-4 py-3">#</th>
                <th scope="col" className="px-4 py-3">{r.player}</th>
                <th scope="col" className="hidden px-4 py-3 text-right sm:table-cell">{r.played}</th>
                <th scope="col" className="hidden px-4 py-3 text-right sm:table-cell">{r.titles}</th>
                <th scope="col" className="px-4 py-3 text-right">{r.points}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ranking.map((row, i) => (
                <tr key={row.key} className={cx(i < 3 && "bg-ball-400/5")}>
                  <td className="px-4 py-3 font-display text-base font-extrabold text-fg-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {row.name}
                    {row.titles > 0 && <Trophy className="ml-2 inline size-3.5 text-ball-500" aria-label={r.titles} />}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{row.tournaments}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{row.titles}</td>
                  <td className="px-4 py-3 text-right font-display text-base font-extrabold tabular-nums">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
