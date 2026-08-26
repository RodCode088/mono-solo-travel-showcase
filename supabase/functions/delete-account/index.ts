// Mono Solo Travel — borra la cuenta del cliente autenticado que llama.
//
// El SDK del navegador no tiene forma de borrar auth.users -- solo la Admin
// API puede, y esa requiere la service_role key, que nunca debe vivir en el
// navegador. Esta función corre con esa key en el servidor: primero valida
// el token de quien llama (auth.getUser), y solo borra ESA cuenta -- nunca
// recibe ni acepta un id de cuenta distinto por parámetro.
//
// Cascada ya definida en el esquema (no hace falta hacer nada más aquí):
// profiles, reviews y favorites se borran con la cuenta; bookings.user_id
// queda en null (se conserva el historial de la reserva, solo se desvincula
// del cliente).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "invalid session" }), { status: 401 });
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(userData.user.id);
  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
