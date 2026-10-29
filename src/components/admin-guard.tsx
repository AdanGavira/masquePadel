import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { backend } from "@/lib/data";
import { getDictionary, href, type Locale } from "@/lib/i18n";
import { Container } from "./ui";

/** Devuelve el administrador o la pantalla que hay que mostrar en su lugar. */
export async function requireAdminPage(locale: Locale, path: string) {
  const user = await backend.getCurrentUser();
  if (!user) redirect(`${href(locale, "/acceso")}?next=${encodeURIComponent(href(locale, path))}`);
  if (user.role === "admin") return { user, denied: null };
  return {
    user,
    denied: (
      <Container className="py-24 text-center">
        <ShieldAlert className="mx-auto size-12 text-fg-muted" />
        <p className="mt-4 text-lg">{getDictionary(locale).admin.forbidden}</p>
      </Container>
    ),
  };
}
