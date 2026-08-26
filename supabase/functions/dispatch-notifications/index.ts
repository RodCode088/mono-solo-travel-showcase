// Mono Solo Travel — worker outbox.
//
// Drena public.notifications (status='pending', scheduled_for <= now()) y
// envía por email vía Resend. No se invoca desde el navegador: se llama por
// HTTP (pg_cron+pg_net, o un cron externo) cada pocos minutos.
// Ver docs/product/AUTOMATION_BLUEPRINT.md y docs/execution/PENDIENTES.md
// para el diseño completo y los pasos de despliegue.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "Mono Solo Travel <onboarding@resend.dev>";
const RESEND_REPLY_TO = Deno.env.get("RESEND_REPLY_TO") || "monosolot@gmail.com";
const DISPATCH_SECRET = Deno.env.get("DISPATCH_SECRET");
const BATCH_SIZE = 20;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function moneyFmt(total: unknown, currency: unknown) {
  return `${currency || "USD"} ${Number(total || 0).toFixed(2)}`;
}

// Mismos tokens de marca que el sitio (src/styles/react.css): tinta oscura,
// dorado, crema. Fuentes web-safe -- los clientes de correo no cargan Inter
// ni Fraunces, así que Georgia/Arial son los sustitutos más cercanos.
const BRAND = {
  ink: "#101a12",
  cream: "#f6f1e3",
  sand: "#ece3cd",
  gold: "#f0b62f",
  goldText: "#8f6209",
  muted: "#5c6b5e",
};

function wrapEmail(bodyHtml: string) {
  return `
<div style="background:${BRAND.cream};padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink};">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${BRAND.sand};">
    <tr>
      <td style="background:${BRAND.ink};padding:28px 32px;text-align:center;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:2px;color:${BRAND.gold};">MONO SOLO TRAVEL</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px 8px 32px;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="background:${BRAND.sand};padding:20px 32px;text-align:center;font-size:12px;color:${BRAND.muted};">
        Mono Solo Travel &middot; Panam&aacute;<br/>
        <a href="https://wa.me/50763501228" style="color:${BRAND.goldText};text-decoration:none;">WhatsApp +507 6350-1228</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:monosolot@gmail.com" style="color:${BRAND.goldText};text-decoration:none;">monosolot@gmail.com</a>
      </td>
    </tr>
  </table>
</div>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${BRAND.ink};">${text}</h1>`;
}

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:${BRAND.muted};font-size:13px;width:140px;">${label}</td><td style="padding:6px 0;font-weight:600;">${value}</td></tr>`;
}

function button(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND.ink};color:${BRAND.gold};padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">${text}</a>`;
}

function renderEmail(row: { kind: string; payload: Record<string, unknown> }) {
  const p = row.payload || {};
  const dateStr = p.date ? String(p.date) : "por confirmar";
  const timeStr = p.time ? String(p.time).slice(0, 5) : "";

  if (row.kind === "booking_received_admin") {
    return {
      subject: `Reserva confirmada ${p.booking_code ?? ""} — ${p.experience_title ?? ""}`,
      html: wrapEmail(`
        ${heading("Nueva reserva confirmada")}
        <table role="presentation" width="100%" style="border-collapse:collapse;">
          ${detailRow("Código", String(p.booking_code ?? ""))}
          ${detailRow("Experiencia", String(p.experience_title ?? ""))}
          ${detailRow("Fecha", `${dateStr} ${timeStr}`)}
          ${detailRow("Viajeros", String(p.guests ?? ""))}
          ${detailRow("Total", moneyFmt(p.total, p.currency))}
          ${detailRow("Contacto", `${p.contact_name ?? ""} — ${p.contact_email ?? ""} — ${p.contact_phone || "sin telefono"}`)}
          ${p.referral_partner_name ? detailRow("Origen QR", String(p.referral_partner_name)) : ""}
        </table>
        <p style="margin-top:16px;color:${BRAND.muted};">Se confirmó automáticamente. Coordina el pago con el cliente cuando puedas.</p>
        ${button("Ver en el panel admin", "https://monosolotravel.com/admin/dashboard")}
      `),
    };
  }

  if (row.kind === "booking_received_customer") {
    return {
      subject: `¡Tu reserva está confirmada! — ${p.experience_title ?? "Mono Solo Travel"}`,
      html: wrapEmail(`
        ${heading("¡Tu reserva está confirmada!")}
        <p>Hola ${p.contact_name ?? ""}, tu cupo para <strong>${p.experience_title ?? ""}</strong> ya quedó confirmado.</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;margin-top:8px;">
          ${detailRow("Código de reserva", String(p.booking_code ?? ""))}
          ${detailRow("Fecha", `${dateStr} ${timeStr}`)}
          ${detailRow("Viajeros", String(p.guests ?? ""))}
          ${detailRow("Total", moneyFmt(p.total, p.currency))}
        </table>
        <p style="margin-top:16px;color:${BRAND.muted};">Te escribiremos para coordinar el pago y los detalles. Cualquier duda, respóndenos a este correo o por WhatsApp.</p>
      `),
    };
  }

  if (row.kind === "signup_admin") {
    return {
      subject: `Nuevo registro — ${p.full_name ?? p.email ?? "cliente"}`,
      html: wrapEmail(`
        ${heading("Nuevo usuario registrado")}
        <table role="presentation" width="100%" style="border-collapse:collapse;">
          ${detailRow("Nombre", String(p.full_name ?? "(sin nombre)"))}
          ${detailRow("Correo", String(p.email ?? ""))}
          ${detailRow("Teléfono", String(p.phone || "sin telefono"))}
        </table>
        <p style="margin-top:16px;color:${BRAND.muted};">Sin reservas todavía — solo creó cuenta.</p>
      `),
    };
  }

  if (row.kind === "signup_welcome") {
    return {
      subject: "¡Bienvenido a Mono Solo Travel!",
      html: wrapEmail(`
        ${heading(`¡Bienvenido${p.full_name ? ", " + p.full_name : ""}!`)}
        <p>Tu cuenta ya está lista. Desde aquí puedes reservar experiencias en Panamá, guardar tus favoritas y ver el estado de tus reservas sin volver a escribir tus datos cada vez.</p>
        ${button("Explorar experiencias", "https://monosolotravel.com/experiencias")}
        <p style="margin-top:20px;color:${BRAND.muted};">¿Dudas? Respóndenos a este correo o por WhatsApp.</p>
      `),
    };
  }

  if (row.kind === "thanks_and_review") {
    const reviewUrl = p.experience_slug
      ? `https://monosolotravel.com/experiencias/${p.experience_slug}#resenas`
      : "https://monosolotravel.com";
    return {
      subject: `¿Qué tal estuvo ${p.experience_title ?? "tu experiencia"}?`,
      html: wrapEmail(`
        ${heading("¡Gracias por viajar con nosotros!")}
        <p>Hola ${p.contact_name ?? ""}, esperamos que hayas disfrutado <strong>${p.experience_title ?? ""}</strong>.</p>
        <p>Nos encantaría conocer tu opinión — toma menos de un minuto:</p>
        ${button("Dejar una reseña", reviewUrl)}
      `),
    };
  }

  return { subject: `Mono Solo Travel — ${row.kind}`, html: wrapEmail(`<pre>${JSON.stringify(p, null, 2)}</pre>`) };
}

async function sendViaResend(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY no configurada");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html, reply_to: RESEND_REPLY_TO }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.message || `Resend respondió ${res.status}`);
  }
  return body?.id ?? null;
}

Deno.serve(async (req) => {
  if (DISPATCH_SECRET) {
    const got = req.headers.get("x-dispatch-secret");
    if (got !== DISPATCH_SECRET) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
  }

  const { data: rows, error } = await supabase
    .from("notifications")
    .select("id, booking_id, kind, channel, recipient, payload, attempts")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = [];
  for (const row of rows ?? []) {
    await supabase.from("notifications").update({ status: "sending" }).eq("id", row.id);

    try {
      if (row.channel !== "email") {
        throw new Error(`canal ${row.channel} sin implementar todavía`);
      }
      const { subject, html } = renderEmail(row as { kind: string; payload: Record<string, unknown> });
      const providerId = await sendViaResend(row.recipient, subject, html);
      await supabase
        .from("notifications")
        .update({ status: "sent", provider_id: providerId, sent_at: new Date().toISOString() })
        .eq("id", row.id);
      results.push({ id: row.id, status: "sent" });
    } catch (err) {
      const attempts = (row.attempts || 0) + 1;
      await supabase
        .from("notifications")
        .update({
          status: attempts >= 5 ? "failed" : "pending",
          attempts,
          last_error: String((err as Error)?.message ?? err),
        })
        .eq("id", row.id);
      results.push({ id: row.id, status: "error", error: String((err as Error)?.message ?? err) });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
