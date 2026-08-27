# Mono Solo Travel

Un marketplace turístico real, en producción, para un operador de solo-travel en Panamá — los viajeros exploran y reservan experiencias de varios días o de un día, y el operador maneja toda la trastienda (contenido, inventario, reservas, aprobación de pagos) desde un panel admin dentro de la propia app, sin tocar código.

**App en vivo:** https://monosolotravel.com

> Esta es una copia curada del código de producción, publicada con fines de portfolio. Se excluyeron documentos internos del cliente (contratos, precios, material multimedia crudo, notas de planificación diaria) — todo lo que hay aquí es código fuente o los documentos de arquitectura/decisiones detrás de él. El historial completo vive en un repositorio privado ligado a un cliente real.

## Qué hace

- **Catálogo público** de experiencias turísticas en toda Panamá, filtrable por provincia/categoría, bilingüe (ES/EN). Hoy sirve 45 experiencias activas en 5 provincias; abre en inglés por defecto, porque la mayoría del tráfico son mochileros internacionales.
- **Reserva con cuenta, consulta sin cuenta.** El flujo `/reservar` → `/checkout` exige sesión (guard `RequireCustomer`); sin ella redirige a `/login`. La confirmación, en cambio, es pública: se resuelve por un token en la URL, así que el viajero consulta el estado de su reserva desde cualquier dispositivo sin volver a autenticarse.
- **Panel admin** para el operador: aprobar/rechazar reservas y pagos, y editar el contenido de las experiencias (descripciones, fotos, categoría, provincia, slots destacados) directamente desde la interfaz — sin necesidad de un desarrollador para cambios de contenido del día a día.
- **Programa de referidos con hostales**: códigos QR imprimibles por hostal socio que enlazan a una vista pre-filtrada del catálogo, para poder rastrear el tráfico por fuente de referido.
- **Notificaciones transaccionales** (reserva recibida, alertas al admin) despachadas de forma asíncrona mediante una tabla outbox + una Edge Function de Supabase, en lugar de disparar emails directo desde triggers de base de datos.

## Stack técnico

| Capa | Elección |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router 7 (`createBrowserRouter`, rutas limpias) |
| Backend | Supabase (Postgres, Auth, RLS, RPC, Edge Functions) |
| Hosting | Cloudflare Pages, desplegado desde Git, fallback SPA vía `public/_redirects` |
| Lenguaje | JavaScript (ESM), SQL (migraciones de Postgres) |

## Puntos de arquitectura

- **Row Level Security como frontera real de seguridad.** Se asume que la clave pública/anon de Supabase queda expuesta en el navegador — la autorización se aplica en las políticas RLS de Postgres y en RPCs controladas (`create_guest_booking`, `get_public_booking_confirmation`, `approve_booking_payment`, `reject_booking_payment`), no ocultando botones en la interfaz. Ver [`docs/architecture/ACCESS_CONTROL.md`](docs/architecture/ACCESS_CONTROL.md).
- **Modelo de dominio explícito** para experiencias, disponibilidad, reservas y pagos, mantenido con 27 migraciones SQL incrementales en [`supabase/migrations/`](supabase/migrations) en lugar de un volcado de schema monolítico — ver [`docs/architecture/DOMAIN_MODEL.md`](docs/architecture/DOMAIN_MODEL.md).
- **Resolución de configuración con fallback mock-first**: la app puede correr completamente offline contra datos mock, luego incorporar una configuración local, luego variables de entorno — así todo el flujo de reserva se puede demostrar sin ninguna credencial de backend.
- **Decisiones documentadas, no solo código.** Las elecciones de stack (Supabase vs. un backend propio vs. Firebase, Cloudflare Pages vs. Vercel) están escritas con el análisis de tradeoffs que realmente se hizo — ver [`docs/decisions/ADR-001-SUPABASE-CLOUDFLARE.md`](docs/decisions/ADR-001-SUPABASE-CLOUDFLARE.md).
- **QA integrado en `npm run check`**: un paso de lint de JS, una verificación de resolución de imports, y un escaneo de secretos antes de que cualquier cambio salga (`scripts/qa/`).

## Cómo se construyó

Este proyecto se construyó en solitario, de punta a punta — alcance de producto, modelo de datos, políticas RLS, interfaz, y los flujos del panel admin — usando Claude Code y OpenAI Codex como entorno de desarrollo principal, con un flujo de trabajo agentic y guiado por especificación, no a base de prompts sueltos:

- Un conjunto pequeño de documentos fuente de verdad (`docs/architecture/`, `docs/decisions/`) define el modelo de dominio, las reglas de acceso y las decisiones de arquitectura aceptadas *antes* de que cualquier cambio de código se implemente, y ambos agentes reciben esos documentos como contexto en cada sesión.
- Los cambios de base de datos pasan siempre por migraciones SQL numeradas y revisadas — nunca una edición directa del schema — así que el historial de *por qué* el schema luce como luce queda trazable.
- Cada cambio pasa por el mismo filtro `npm run check` (lint, resolución de imports, escaneo de secretos), sea un humano o un agente quien lo haya escrito.
- Yo reviso y pruebo cada cambio antes de que salga a producción — los agentes escriben e iteran código bajo dirección, no deciden el producto ni mergean nada sin revisión.

Con gusto explico a detalle cualquier parte de esto — las políticas RLS, el flujo de la RPC de reserva, o la función de edición de contenido del panel admin son las partes que primero señalaría.

## Estructura del proyecto

```text
/
  index.html
  package.json
  vite.config.js
  tailwind.config.js
  public/_redirects        # fallback SPA de Cloudflare Pages
  src/
    main.jsx
    App.jsx
    data/                  # cargadores de contenido de experiencias
    config/                # resolución de configuración (mock -> local -> env)
    lib/
      config/
      services/             # servicios de dominio (reservas, pagos, admin)
      supabase/             # cliente de Supabase
    components/ui/
    features/
      admin/                 # trastienda: reservas, pagos, edición de contenido
      booking/                # flujo de reserva (selección, checkout, confirmación)
      catalog/                # catálogo público + detalle de experiencia
    routes/
  scripts/
    config/                  # generador de configuración de runtime
    qa/                      # lint / chequeo de imports / escaneo de secretos / smoke e2e
  supabase/
    migrations/              # historial SQL incremental y numerado
    functions/                # Edge Functions (despacho de notificaciones, borrado de cuenta)
    tests/                    # queries de verificación de RLS
  docs/
    architecture/             # modelo de dominio, control de acceso, historial de migración
    decisions/                 # ADRs
```

## Cómo correrlo en local

```bash
npm install
npm run dev       # http://127.0.0.1:5174, corre contra datos mock por defecto
npm run build      # genera dist/
npm run check       # lint + chequeo de imports + escaneo de secretos
```

Para apuntar la app a un proyecto real de Supabase en lugar de datos mock:

```bash
$env:SUPABASE_URL = "<project-url>"
$env:SUPABASE_ANON_KEY = "<public-anon-or-publishable-key>"
$env:MS_MODE = "staging"
npm run config:generate
npm run dev
```

`service_role` o cualquier clave secreta/de servidor nunca debe usarse en el frontend — ver [`docs/decisions/ADR-001-SUPABASE-CLOUDFLARE.md`](docs/decisions/ADR-001-SUPABASE-CLOUDFLARE.md) para el porqué.

## Para profundizar

- [`docs/architecture/DOMAIN_MODEL.md`](docs/architecture/DOMAIN_MODEL.md) — entidades, estados, y cómo se relacionan reservas/pagos/disponibilidad.
- [`docs/architecture/ACCESS_CONTROL.md`](docs/architecture/ACCESS_CONTROL.md) — roles y qué puede/no puede hacer cada uno, aplicado en RLS.
- [`docs/architecture/MIGRATION_PLAN.md`](docs/architecture/MIGRATION_PLAN.md) — cómo se secuenció la migración del frontend a React/Vite sin tocar schema/RLS/RPC.
- [`docs/decisions/ADR-001-SUPABASE-CLOUDFLARE.md`](docs/decisions/ADR-001-SUPABASE-CLOUDFLARE.md) — por qué Supabase + Cloudflare Pages sobre las alternativas consideradas.
