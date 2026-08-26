-- =============================================================================
-- Mono Solo Travel — Verificación de RLS y permisos
--
-- Ejecutar en Supabase staging (SQL Editor) DESPUÉS de migraciones 001-003 y seed.
-- Cada bloque simula un rol con `set local role` + claims JWT y comprueba el
-- comportamiento esperado. Ejecutar bloque por bloque y comparar con "ESPERADO".
--
-- NOTA: usa transacciones para no dejar estado. `set local` solo aplica dentro
-- de la transacción.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ANÓNIMO no puede listar reservas.  ESPERADO: 0 filas.
-- -----------------------------------------------------------------------------
begin;
  set local role anon;
  select count(*) as anon_bookings_visibles from public.bookings;  -- ESPERADO: 0
rollback;

-- -----------------------------------------------------------------------------
-- 2. ANÓNIMO no puede listar pagos.  ESPERADO: 0 filas.
-- -----------------------------------------------------------------------------
begin;
  set local role anon;
  select count(*) as anon_payments_visibles from public.payments;  -- ESPERADO: 0
rollback;

-- -----------------------------------------------------------------------------
-- 3. ANÓNIMO sí puede leer experiencias activas y disponibilidad abierta.
--    ESPERADO: >= 1 fila en cada uno (si el seed se ejecutó).
-- -----------------------------------------------------------------------------
begin;
  set local role anon;
  select count(*) as anon_experiencias_activas from public.experiences where status = 'active';
  select count(*) as anon_disponibilidad_abierta from public.availability where status = 'open';
rollback;

-- -----------------------------------------------------------------------------
-- 4. ANÓNIMO no puede actualizar un pago.  ESPERADO: 0 filas afectadas (RLS).
-- -----------------------------------------------------------------------------
begin;
  set local role anon;
  update public.payments set status = 'approved' where true;  -- ESPERADO: UPDATE 0
rollback;

-- -----------------------------------------------------------------------------
-- 5. ANÓNIMO no puede aprobar pagos vía RPC.  ESPERADO: excepción NOT_AUTHORIZED.
-- -----------------------------------------------------------------------------
begin;
  set local role anon;
  -- Debe lanzar: NOT_AUTHORIZED: se requiere rol admin
  select public.approve_booking_payment('00000000-0000-0000-0000-000000000000');
rollback;

-- -----------------------------------------------------------------------------
-- 6. USUARIO autenticado NO admin no puede aprobar pagos.
--    Reemplaza el UUID por un usuario real no admin.  ESPERADO: excepción.
-- -----------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
  -- Debe lanzar: NOT_AUTHORIZED
  select public.approve_booking_payment('00000000-0000-0000-0000-000000000000');
rollback;

-- -----------------------------------------------------------------------------
-- 7. ADMIN sí puede listar reservas y pagos.
--    Reemplaza <ADMIN_UUID> por el UUID del admin (debe existir profiles.role='admin').
--    ESPERADO: cuenta total real (no 0 si hay reservas).
-- -----------------------------------------------------------------------------
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<ADMIN_UUID>","role":"authenticated"}';
  select public.is_admin() as soy_admin;                       -- ESPERADO: true
  select count(*) as admin_bookings_visibles from public.bookings;
  select count(*) as admin_payments_visibles from public.payments;
rollback;

-- -----------------------------------------------------------------------------
-- 8. Confirmación pública SOLO funciona con el token correcto.
--    a) token inexistente -> null.
--    b) token real -> json (reemplaza <PUBLIC_TOKEN> tras crear una reserva de prueba).
-- -----------------------------------------------------------------------------
begin;
  set local role anon;
  select public.get_public_booking_confirmation('00000000-0000-0000-0000-000000000000') as token_invalido; -- ESPERADO: null
  -- select public.get_public_booking_confirmation('<PUBLIC_TOKEN>') as token_valido;  -- ESPERADO: json
rollback;

-- -----------------------------------------------------------------------------
-- 9. Anti-sobreventa: la reserva de invitado nunca debe exceder cupos.
--    Crear reservas hasta agotar y verificar que la siguiente lanza NOT_ENOUGH_SPOTS.
--    (Prueba manual sugerida; depende de los cupos del seed.)
-- -----------------------------------------------------------------------------
-- begin;
--   set local role anon;
--   select public.create_guest_booking(
--     (select id from public.experiences where legacy_id = 'e-001'),
--     (select id from public.availability where status='open'
--        and experience_id = (select id from public.experiences where legacy_id='e-001') limit 1),
--     2, 'Test QA', 'qa@example.com', '+507 6000 0000', 'E2E-QA-REF-1', 'cuantoapp'
--   );
-- rollback;
