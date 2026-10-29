# 🎾 masquePadel

Web de un club de pádel en Sevilla (ficticio, de momento): portada, reserva de pistas online, área de jugador y panel de administración. Disponible en español e inglés, con modo claro y oscuro.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (opcional)

## Funcionalidades

- **Reservas:** 4 pistas, turnos de 90 min de 08:00 a 21:30 (el último acaba a las 23:00), hasta 14 días vista.
- **Precio:** 20 € por pista (5 € por jugador), pago en el club.
- **Cancelación:** gratuita hasta 24 h antes del partido.
- **Límite:** 3 reservas activas por jugador.
- **Mis reservas:** próximas reservas, historial y cancelación.
- **Panel de administración:** ocupación e ingresos del día, reservas con nombre del jugador y bloqueo de pistas.
- **Academia:** cursos mensuales por niveles, solicitud online (con o sin cuenta), prueba de nivel gratuita los sábados y asignación de grupo desde el panel. Las clases ocupan sus pistas en el calendario de reservas.
- **Torneos y ranking:** torneos de fin de semana por parejas (masculino, femenino y mixto) en las pistas 1–3, inscripción online, cuadro eliminatorio con cabezas de serie según el ranking, resultados desde el panel y ranking individual por puntos (campeón 100, finalista 60, semifinal 35, cuartos 20, participación 5).
- **Tienda:** catálogo de palas (con forma y nivel), zapatillas y ropa (con stock por talla) y accesorios. Carrito, pedido online con código de recogida y pago en el club. Desde el panel se gestionan productos, precios, stock y el estado de los pedidos.

Toda la configuración del club (horario, precios, reglas) está en [`src/lib/club.ts`](src/lib/club.ts), la de la academia (grupos, horarios, entrenadores, precios) en [`src/lib/academy.ts`](src/lib/academy.ts) y la de los torneos (pistas, puntos del ranking) en [`src/lib/tournaments.ts`](src/lib/tournaments.ts).

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, la web funciona en **modo demostración**: cada visitante tiene su propio club de prueba guardado en una cookie firmada de su navegador, con reservas de socios ficticios ya cargadas. Funciona igual en local y en Vercel sin base de datos.

| Cuenta | Email | Contraseña |
|---|---|---|
| Jugador | `jugador@masquepadel.test` | `padel1234` |
| Administrador | `admin@masquepadel.test` | `admin1234` |

Para empezar de cero, borra las cookies del sitio.

## Pasar a Supabase

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En *SQL Editor*, ejecuta en orden [`0001_reservas.sql`](supabase/migrations/0001_reservas.sql), [`0002_academia.sql`](supabase/migrations/0002_academia.sql), [`0003_torneos.sql`](supabase/migrations/0003_torneos.sql) y [`0004_tienda.sql`](supabase/migrations/0004_tienda.sql) (incluye un catálogo de ejemplo).
3. Copia `.env.example` a `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Regístrate en la web y hazte administrador:
   ```sql
   update profiles set role = 'admin' where email = 'tu@email.com';
   ```

La base de datos impide por sí sola dos reservas en el mismo hueco, reservar huecos bloqueados o pasados y cancelar con menos de 24 h.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run lint` | ESLint |
| `npm test` | Tests (turnos, zona horaria, reglas de reserva) |

## Estructura

```
src/
  app/[locale]/        páginas (es/en): portada, reservas, mis-reservas, acceso, registro, admin
  app/actions.ts       acciones de servidor (login, reservar, cancelar, bloquear)
  components/          cabecera, calendario de reservas, formularios…
  lib/club.ts          configuración del club
  lib/slots.ts         turnos y reglas de horario
  lib/bookings.ts      reglas de negocio de las reservas
  lib/data/            almacenamiento: modo demo (cookie) y Supabase
  lib/i18n/            textos en español e inglés
supabase/migrations/   esquema SQL
legacy-java/           versión anterior de escritorio (Java Swing)
```

**Autor:** [Adan Gavira](https://github.com/AdanGavira)
