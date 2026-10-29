import { CLUB } from "./club";
import type { Locale } from "./i18n";

/**
 * Textos legales (LSSI-CE, RGPD y LOPDGDD). masquePadel es un club ficticio:
 * antes de usar la web para un negocio real hay que completar los datos del
 * titular y revisar los textos con un profesional.
 */

export type LegalDoc = "aviso-legal" | "privacidad" | "cookies";
export const LEGAL_DOCS: LegalDoc[] = ["aviso-legal", "privacidad", "cookies"];

interface Section {
  title: string;
  /** Párrafos; las líneas que empiezan por "• " se muestran como lista. */
  body: string[];
}

export interface LegalText {
  title: string;
  intro: string;
  sections: Section[];
  /** Solo en la política de cookies. */
  cookies?: { name: string; owner: string; purpose: string; duration: string }[];
}

const address = `${CLUB.address.street}, ${CLUB.address.postalCode} ${CLUB.address.city}`;
const email = CLUB.contact.email;

const es: Record<LegalDoc, LegalText> = {
  "aviso-legal": {
    title: "Aviso legal",
    intro:
      "masquePadel es un proyecto de portfolio: el club, sus datos de contacto y los productos son ficticios. Este aviso sirve de plantilla y debe completarse con los datos reales del titular antes de abrir la web al público.",
    sections: [
      {
        title: "Titular del sitio web",
        body: [
          "En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos del titular:",
          "• Titular: masquePadel (nombre o razón social pendiente)",
          "• NIF/CIF: pendiente",
          `• Domicilio: ${address}`,
          `• Email: ${email}`,
          `• Teléfono: ${CLUB.contact.phone}`,
        ],
      },
      {
        title: "Objeto y condiciones de uso",
        body: [
          "Esta web permite consultar información del club, reservar pistas, solicitar plaza en la academia, inscribirse en torneos y hacer pedidos de la tienda para recogerlos en el club.",
          "El usuario se compromete a hacer un uso adecuado de los contenidos y servicios, a facilitar datos veraces y a no emplearlos para actividades ilícitas o contrarias a la buena fe.",
        ],
      },
      {
        title: "Reservas, inscripciones y pedidos",
        body: [
          "Las reservas de pista duran 90 minutos y pueden cancelarse gratuitamente hasta 24 horas antes de su inicio. Las inscripciones a torneos pueden cancelarse mientras estén abiertas.",
          "Los pedidos de la tienda se pagan en el club al recogerlos y pueden cancelarse mientras no se hayan recogido. Los precios incluyen IVA.",
        ],
      },
      {
        title: "Propiedad intelectual",
        body: [
          "Los textos, el diseño, el logotipo y el código de esta web pertenecen a su autor. Las marcas y nombres comerciales de terceros que puedan aparecer son propiedad de sus respectivos titulares.",
        ],
      },
      {
        title: "Responsabilidad",
        body: [
          "El titular no se responsabiliza de los daños derivados de interrupciones del servicio, errores técnicos o del uso indebido de la web por parte de los usuarios.",
        ],
      },
      {
        title: "Legislación aplicable",
        body: ["Este aviso se rige por la legislación española. Para cualquier controversia serán competentes los juzgados y tribunales de Sevilla."],
      },
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    intro:
      "Explicamos qué datos personales tratamos, para qué y cuáles son tus derechos, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).",
    sections: [
      {
        title: "Responsable del tratamiento",
        body: [`masquePadel (datos del titular en el aviso legal). Contacto: ${email}.`],
      },
      {
        title: "Qué datos tratamos",
        body: [
          "• Cuenta: nombre, email y contraseña (guardada cifrada).",
          "• Reservas de pista, inscripciones a torneos (incluidos nombre y email de tu pareja) y pedidos de la tienda.",
          "• Solicitudes de la academia: nombre, email, teléfono, experiencia, disponibilidad y, si es para un menor, su edad.",
        ],
      },
      {
        title: "Para qué los usamos y base legal",
        body: [
          "• Gestionar tu cuenta, reservas, inscripciones, pedidos y plaza en la academia: ejecución del servicio que solicitas (art. 6.1.b RGPD).",
          "• Contactarte en relación con esos servicios: interés legítimo (art. 6.1.f RGPD).",
          "• Publicar los cuadros, resultados y el ranking de los torneos con el nombre de los jugadores: consentimiento al inscribirte (art. 6.1.a RGPD).",
          "No usamos tus datos para publicidad ni elaboramos perfiles.",
        ],
      },
      {
        title: "Datos de terceros y menores",
        body: [
          "Si inscribes a otra persona como pareja de torneo o solicitas una plaza para un menor, declaras contar con su consentimiento o el de sus padres o tutores.",
        ],
      },
      {
        title: "Encargados y destinatarios",
        body: [
          "Los datos se alojan en Supabase (base de datos y autenticación, servidores en la UE) y la web se sirve a través de Vercel. Ambos actúan como encargados del tratamiento con las garantías del RGPD. No cedemos datos a terceros salvo obligación legal.",
        ],
      },
      {
        title: "Cuánto tiempo los conservamos",
        body: [
          "Mientras mantengas tu cuenta y, después, el tiempo necesario para atender posibles responsabilidades legales. Los resultados y el ranking de torneos se conservan como histórico del club.",
        ],
      },
      {
        title: "Tus derechos",
        body: [
          `Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${email}. Si consideras que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).`,
        ],
      },
    ],
  },
  cookies: {
    title: "Política de cookies",
    intro:
      "Esta web solo usa cookies técnicas imprescindibles para funcionar, por lo que no necesita tu consentimiento (art. 22.2 LSSI-CE). No usamos cookies de análisis ni de publicidad.",
    sections: [
      {
        title: "Almacenamiento en tu navegador",
        body: [
          "Además de las cookies de la tabla, guardamos en el almacenamiento local de tu navegador el tema claro u oscuro y el contenido del carrito. No salen de tu dispositivo hasta que haces el pedido.",
        ],
      },
      {
        title: "Mapa de Google",
        body: [
          "El mapa de la portada no se carga hasta que pulsas «Cargar mapa». A partir de ese momento Google puede instalar sus propias cookies, según su política de privacidad (policies.google.com).",
        ],
      },
      {
        title: "Cómo eliminarlas",
        body: [
          "Puedes borrar las cookies desde la configuración de tu navegador. Si lo haces, tendrás que volver a iniciar sesión.",
        ],
      },
    ],
    cookies: [
      { name: "sb-*-auth-token", owner: "masquePadel (Supabase)", purpose: "Mantener tu sesión iniciada", duration: "Sesión / 1 semana" },
      { name: "mp_session", owner: "masquePadel", purpose: "Sesión en el modo demostración", duration: "30 días" },
      { name: "mp_demo, mp_demo_t, mp_demo_s", owner: "masquePadel", purpose: "Datos de prueba del modo demostración", duration: "30 días" },
      { name: "mp_locale", owner: "masquePadel", purpose: "Recordar tu idioma", duration: "1 año" },
    ],
  },
};

const en: Record<LegalDoc, LegalText> = {
  "aviso-legal": {
    title: "Legal notice",
    intro:
      "masquePadel is a portfolio project: the club, its contact details and the products are fictional. This notice is a template and must be completed with the owner's real details before the site goes public.",
    sections: [
      {
        title: "Website owner",
        body: [
          "In accordance with article 10 of Spanish Law 34/2002 on Information Society Services (LSSI-CE), the owner's details are:",
          "• Owner: masquePadel (legal name pending)",
          "• Tax ID: pending",
          `• Address: ${address}`,
          `• Email: ${email}`,
          `• Phone: ${CLUB.contact.phone}`,
        ],
      },
      {
        title: "Purpose and terms of use",
        body: [
          "This website lets you check club information, book courts, apply to the academy, enter tournaments and place shop orders to collect at the club.",
          "Users agree to use the content and services appropriately, to provide truthful data and not to use them for unlawful purposes.",
        ],
      },
      {
        title: "Bookings, entries and orders",
        body: [
          "Court bookings last 90 minutes and can be cancelled free of charge up to 24 hours before they start. Tournament entries can be cancelled while registration is open.",
          "Shop orders are paid at the club on collection and can be cancelled until collected. Prices include VAT.",
        ],
      },
      {
        title: "Intellectual property",
        body: [
          "The texts, design, logo and code of this website belong to its author. Third-party trademarks that may appear belong to their respective owners.",
        ],
      },
      {
        title: "Liability",
        body: ["The owner is not liable for damages arising from service interruptions, technical errors or misuse of the website by users."],
      },
      {
        title: "Governing law",
        body: ["This notice is governed by Spanish law. The courts of Seville shall have jurisdiction over any dispute."],
      },
    ],
  },
  privacidad: {
    title: "Privacy policy",
    intro:
      "We explain which personal data we process, why, and what your rights are, under Regulation (EU) 2016/679 (GDPR) and Spanish Organic Law 3/2018 (LOPDGDD).",
    sections: [
      { title: "Data controller", body: [`masquePadel (owner details in the legal notice). Contact: ${email}.`] },
      {
        title: "Data we process",
        body: [
          "• Account: name, email and password (stored encrypted).",
          "• Court bookings, tournament entries (including your partner's name and email) and shop orders.",
          "• Academy applications: name, email, phone, experience, availability and, for minors, their age.",
        ],
      },
      {
        title: "Purposes and legal basis",
        body: [
          "• Managing your account, bookings, entries, orders and academy place: performance of the service you request (art. 6.1.b GDPR).",
          "• Contacting you about those services: legitimate interest (art. 6.1.f GDPR).",
          "• Publishing tournament draws, results and the ranking with players' names: consent when entering (art. 6.1.a GDPR).",
          "We don't use your data for advertising or profiling.",
        ],
      },
      {
        title: "Third-party data and minors",
        body: [
          "If you enter another person as your tournament partner or apply for a minor, you confirm you have their consent or that of their parents or guardians.",
        ],
      },
      {
        title: "Processors and recipients",
        body: [
          "Data is hosted on Supabase (database and authentication, EU servers) and the website is served through Vercel. Both act as data processors with GDPR safeguards. We don't share data with third parties unless legally required.",
        ],
      },
      {
        title: "Retention",
        body: [
          "While your account is active and then for as long as needed to meet legal obligations. Tournament results and the ranking are kept as club history.",
        ],
      },
      {
        title: "Your rights",
        body: [
          `You can exercise your rights of access, rectification, erasure, objection, restriction and portability by emailing ${email}. You may also complain to the Spanish Data Protection Agency (aepd.es).`,
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie policy",
    intro:
      "This website only uses strictly necessary technical cookies, so it doesn't need your consent (art. 22.2 LSSI-CE). We don't use analytics or advertising cookies.",
    sections: [
      {
        title: "Browser storage",
        body: [
          "Besides the cookies in the table, we store your light or dark theme and your cart contents in your browser's local storage. They don't leave your device until you place an order.",
        ],
      },
      {
        title: "Google map",
        body: [
          "The map on the home page isn't loaded until you click “Load map”. From then on Google may set its own cookies, under its privacy policy (policies.google.com).",
        ],
      },
      { title: "How to delete them", body: ["You can delete cookies in your browser settings. If you do, you'll need to sign in again."] },
    ],
    cookies: [
      { name: "sb-*-auth-token", owner: "masquePadel (Supabase)", purpose: "Keep you signed in", duration: "Session / 1 week" },
      { name: "mp_session", owner: "masquePadel", purpose: "Session in demo mode", duration: "30 days" },
      { name: "mp_demo, mp_demo_t, mp_demo_s", owner: "masquePadel", purpose: "Demo mode test data", duration: "30 days" },
      { name: "mp_locale", owner: "masquePadel", purpose: "Remember your language", duration: "1 year" },
    ],
  },
};

export function getLegal(locale: Locale, doc: LegalDoc): LegalText {
  return (locale === "es" ? es : en)[doc];
}
