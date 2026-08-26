-- =============================================================================
-- Mono Solo Travel — Migración 026: security_invoker en partner_bookings_report
--
-- El linter de seguridad de Supabase marca public.partner_bookings_report como
-- "Security Definer View" (CRITICAL). En Postgres, una vista sin
-- security_invoker=true corre con los privilegios de su dueño y por lo tanto
-- IGNORA el RLS del usuario que consulta -- el comentario original en 013
-- ("RLS de bookings/partners ya restringe...") era incorrecto: ese RLS nunca
-- se aplicaba al consultar la vista.
--
-- Fix: forzar security_invoker=true para que la vista respete el RLS de quien
-- consulta. Con las políticas actuales (partners_admin_all solo admin;
-- bookings_select admin o dueño de la fila), el resultado neto es el mismo
-- para admin (ve todo) y correctamente vacío para cualquier no-admin (partners
-- no le expone filas), que es el comportamiento que se esperaba desde el inicio.
-- =============================================================================

alter view public.partner_bookings_report set (security_invoker = true);

-- =============================================================================
-- Fin migración 026.
-- =============================================================================
