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
- **Próximamente:** tienda, torneos y ranking, academia.

Toda la configuración del club (horario, precios, reglas) está en [`src/lib/club.ts`](src/lib/club.ts).

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, la web funciona en **modo demostración**: los datos se guardan en `.data/demo-db.json` y ya trae reservas de ejemplo.

| Cuenta | Email | Contraseña |
|---|---|---|
| Jugador | `jugador@masquepadel.test` | `padel1234` |
| Administrador | `admin@masquepadel.test` | `admin1234` |

Para empezar de cero, borra la carpeta `.data/`.

## Pasar a Supabase

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En *SQL Editor*, ejecuta [`supabase/migrations/0001_reservas.sql`](supabase/migrations/0001_reservas.sql).
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
  lib/data/            almacenamiento: modo demo (JSON) y Supabase
  lib/i18n/            textos en español e inglés
supabase/migrations/   esquema SQL
legacy-java/           versión anterior de escritorio (Java Swing)
```

**Autor:** [Adan Gavira](https://github.com/AdanGavira)
