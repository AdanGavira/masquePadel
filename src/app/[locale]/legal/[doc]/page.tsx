import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, cx } from "@/components/ui";
import { getDictionary, href, isLocale } from "@/lib/i18n";
import { LEGAL_DOCS, getLegal, type LegalDoc } from "@/lib/legal";

type Params = Promise<{ locale: string; doc: string }>;

const isDoc = (v: string): v is LegalDoc => (LEGAL_DOCS as string[]).includes(v);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, doc } = await params;
  if (!isLocale(locale) || !isDoc(doc)) return {};
  return { title: getLegal(locale, doc).title };
}

export default async function LegalPage({ params }: { params: Params }) {
  const { locale, doc } = await params;
  if (!isLocale(locale) || !isDoc(doc)) notFound();
  const dict = getDictionary(locale);
  const legal = getLegal(locale, doc);

  return (
    <Container className="max-w-3xl py-10 sm:py-14">
      <nav aria-label={dict.footer.legal} className="mb-8 flex flex-wrap gap-2">
        {LEGAL_DOCS.map((d) => (
          <Link
            key={d}
            href={href(locale, `/legal/${d}`)}
            aria-current={d === doc ? "page" : undefined}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              d === doc
                ? "border-navy-700 bg-navy-700 text-white dark:border-ball-500 dark:bg-ball-500 dark:text-navy-950"
                : "border-line text-fg-muted hover:text-fg",
            )}
          >
            {getLegal(locale, d).title}
          </Link>
        ))}
      </nav>

      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{legal.title}</h1>
      <p className="mt-4 rounded-2xl bg-bg-soft p-4 text-fg-muted">{legal.intro}</p>

      {legal.cookies && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-bg-soft text-xs uppercase tracking-wider text-fg-muted">
              <tr>
                {(locale === "es" ? ["Cookie", "Titular", "Finalidad", "Duración"] : ["Cookie", "Owner", "Purpose", "Duration"]).map((h) => (
                  <th key={h} scope="col" className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {legal.cookies.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-3 font-mono text-xs">{c.name}</td>
                  <td className="px-4 py-3">{c.owner}</td>
                  <td className="px-4 py-3">{c.purpose}</td>
                  <td className="px-4 py-3">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {legal.sections.map((section) => {
        const list = section.body.filter((p) => p.startsWith("• "));
        const paragraphs = section.body.filter((p) => !p.startsWith("• "));
        return (
          <section key={section.title} className="mt-10">
            <h2 className="font-display text-xl font-bold">{section.title}</h2>
            {paragraphs.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-fg-muted">
                {p}
              </p>
            ))}
            {list.length > 0 && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-fg-muted">
                {list.map((item) => (
                  <li key={item}>{item.slice(2)}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </Container>
  );
}
