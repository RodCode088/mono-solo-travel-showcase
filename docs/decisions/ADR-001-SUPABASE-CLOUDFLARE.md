# ADR-001 - Backend Supabase + Hosting Cloudflare Pages

- Estado: Aceptada y vigente.
- Fecha original: 2026-06-19.
- Sincronizada: 2026-06-30.
- Decisores: Rodolfo + equipo de desarrollo.

## 1. Contexto actual

Mono Solo Travel usa React + Vite + Tailwind + React Router en el frontend y
Supabase como backend. La decision original de usar Supabase y Cloudflare Pages
se mantiene; lo que cambio fue la tecnologia de presentacion.

La migracion React/Vite ya esta cerrada y verificada sin reescribir schema, RPC
ni RLS.

## 2. Decision

1. Backend (DB + Auth + Storage futuro): Supabase.
2. Hosting del frontend: Cloudflare Pages.
3. Frontend activo: React + Vite + Tailwind.
4. Runtime config: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MS_MODE`.

## 3. Por que Supabase

- Postgres gestionado para experiencias, disponibilidad, reservas y pagos.
- Auth integrada para admin y futuras cuentas cliente.
- Row Level Security como frontera real de seguridad.
- RPC para flujos controlados:
  - `create_guest_booking`
  - `get_public_booking_confirmation`
  - `approve_booking_payment`
  - `reject_booking_payment`
- Storage disponible para una fase posterior de imagenes/comprobantes.
- Plan gratuito suficiente para staging y MVP de bajo trafico.

## 4. Por que Cloudflare Pages

- Hosting estatico ideal para Vite.
- CDN global y SSL automatico.
- Deploy desde Git con previews por rama.
- SPA fallback por `_redirects`, necesario para rutas limpias.
- Plan gratuito generoso.

## 5. Alternativas consideradas

| Opcion | Ventaja | Por que se descarta para el MVP |
|---|---|---|
| Firebase | Rapido, realtime nativo | Modelo NoSQL menos natural para reservas/cupos relacionales |
| Backend propio Node/Express + Postgres | Maximo control | Mas tiempo, costo y mantenimiento |
| LocalStorage/mock | Cero infraestructura | No es entregable real |
| Vercel | Excelente DX | Cloudflare Pages cubre lo necesario y fue la recomendacion |
| PocketBase/Appwrite | Open-source | Operacion adicional a cargo del equipo |

## 6. Riesgos y mitigaciones

| Riesgo | Mitigacion |
|---|---|
| Exponer anon/public key en frontend | Esperado; seguridad real en RLS y RPC. Nunca usar `service_role`. |
| RLS mal configurado | Mantener pruebas RLS y validar antes de lanzamiento. |
| Rutas limpias fallan en deploy | `public/_redirects` versionado y validado en build. |
| Dependencia de cuentas del cliente | Documentar dominio, billing, owner/admin y credenciales fuera del repo. |
| Modelo Supabase mas estrecho que catalogo visual | Agregar migraciones incrementales para contenido/media cuando se decida. |

## 7. Estrategia de entornos

1. Repo Git en GitHub.
2. Supabase staging y production separados o equivalentes documentados.
3. Cloudflare Pages con variables por entorno.
4. Promocion de staging a produccion solo tras QA y criterios de aceptacion.

## 8. Variables requeridas

| Variable | Uso |
|---|---|
| `SUPABASE_URL` | Endpoint del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave publica para el cliente |
| `MS_MODE` | `mock`, `staging` o `production` |

No documentar ni usar `service_role`, secret keys ni database password en el
frontend.

## 9. Implementado hoy

- React/Vite build con output `dist/`.
- Cloudflare Pages fallback en `public/_redirects`.
- Supabase client en `src/lib/supabase/client.js`.
- Service layer en `src/lib/services/*`.
- Guest booking y public confirmation por RPC.
- Admin login/list/approve/reject usando Auth/RLS/RPC.

## 10. Todavia no implementado

- Supabase Storage para imagenes/comprobantes.
- Produccion Cloudflare conectada y validada.
- SEO/legal completo.
- Customer auth real.
- B2B real.
- CRM, leads, contacts, reviews y recommendation service.
