import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { StatusBadge } from "../../../components/ui/StatusBadge.jsx";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { PanelHead } from "../../user/pages/PanelHead.jsx";
import { approvePayment, listAdminBookings, rejectPayment, updateBookingStatus } from "../admin-service.js";

export function AdminRoutePage({ section }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyPaymentId, setBusyPaymentId] = useState(null);
  const [busyBookingId, setBusyBookingId] = useState(null);

  async function loadRows() {
    setError(null);
    const { data, error: loadError } = await listAdminBookings();
    if (loadError) {
      setError(loadError.message);
      setRows([]);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    loadRows();
  }, []);

  async function handlePayment(action, paymentId) {
    if (!paymentId) return;
    setBusyPaymentId(paymentId);
    setNotice(null);
    setError(null);

    const fn = action === "approve" ? approvePayment : rejectPayment;
    const { error: actionError } = await fn(paymentId);
    setBusyPaymentId(null);

    if (actionError) {
      setError(actionError.message);
      return;
    }

    setNotice(t(action === "approve" ? "Pago aprobado y reserva confirmada." : "Pago rechazado."));
    await loadRows();
  }

  async function handleBookingStatus(bookingId, status) {
    if (!bookingId) return;
    setBusyBookingId(bookingId);
    setNotice(null);
    setError(null);

    const { error: actionError } = await updateBookingStatus(bookingId, status);
    setBusyBookingId(null);

    if (actionError) {
      setError(actionError.message);
      return;
    }

    setNotice(t(status === "confirmed" ? "Reserva confirmada." : "Reserva actualizada."));
    await loadRows();
  }

  return (
    <>
      <PanelHead
        eyebrow={t("Panel")}
        title={t("Admin")}
        lead={t("Reservas, estados y pagos opcionales conectados a Supabase.")}
        actions={
          <button className="ms-button ms-button-secondary" type="button" onClick={loadRows}>
            <RefreshCw size={16} aria-hidden="true" />
            {t("Actualizar")}
          </button>
        }
      />

      {notice ? <div className="mt-4"><StateBlock tone="success" title={t("Listo")} text={notice} /></div> : null}
      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo completar")} text={error} /></div> : null}

      {rows === null ? (
        <section className="ms-panel mt-6 p-5">
          <ExperienceLoader compact message="Cargando reservas..." />
        </section>
      ) : (
        <AdminContent
          busyBookingId={busyBookingId}
          busyPaymentId={busyPaymentId}
          onBookingStatus={handleBookingStatus}
          onPaymentAction={handlePayment}
          rows={rows}
          section={section}
        />
      )}
    </>
  );
}

function AdminContent({ busyBookingId, busyPaymentId, onBookingStatus, onPaymentAction, rows, section }) {
  if (section === "reservas") {
    return <AdminBookings busyBookingId={busyBookingId} onBookingStatus={onBookingStatus} rows={rows} />;
  }
  if (section === "pagos") {
    return <AdminPayments busyPaymentId={busyPaymentId} onPaymentAction={onPaymentAction} rows={rows} />;
  }
  return (
    <AdminDashboard
      busyBookingId={busyBookingId}
      busyPaymentId={busyPaymentId}
      onBookingStatus={onBookingStatus}
      onPaymentAction={onPaymentAction}
      rows={rows}
    />
  );
}

function AdminDashboard({ busyBookingId, busyPaymentId, onBookingStatus, onPaymentAction, rows }) {
  const { t } = useLanguage();
  const metrics = useMemo(() => buildMetrics(rows), [rows]);
  const recentRows = rows.slice(0, 5);
  const pendingPayments = rows.filter((row) => row.paymentId && isPendingPayment(row)).slice(0, 5);

  return (
    <>
      <section className="ms-metric-row mt-6">
        <Metric label={t("Reservas")} value={metrics.totalBookings} />
        <Metric label={t("Pendientes")} value={metrics.pending} />
        <Metric label={t("Confirmadas")} value={metrics.confirmed} />
        <Metric label={t("Sin pago")} value={metrics.noPayment} />
        <Metric label={t("Valor reservado")} value={`USD ${metrics.reservationValue}`} />
        <Metric label={t("Contactos")} value={metrics.guests} />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <StatusChart metrics={metrics} />
        <section className="ms-panel p-5">
          <div className="flex flex-col gap-1">
            <h2 className="m-0 font-serif text-3xl text-ink">{t("Reservas recientes")}</h2>
            <p className="m-0 text-sm text-muted">{t("Vista rapida para confirmar cupos o revisar contacto.")}</p>
          </div>
          <div className="mt-4">
            <BookingTable
              busyBookingId={busyBookingId}
              compact
              onBookingStatus={onBookingStatus}
              rows={recentRows}
            />
          </div>
        </section>
      </section>

      <section className="ms-panel mt-6 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 font-serif text-3xl text-ink">{t("Pagos opcionales por revisar")}</h2>
          <p className="m-0 text-sm text-muted">{t("Solo apareceran aqui pagos reales registrados; la reserva ya no exige pago inmediato.")}</p>
        </div>
        <div className="mt-4">
          <PaymentTable
            busyPaymentId={busyPaymentId}
            onPaymentAction={onPaymentAction}
            rows={pendingPayments}
          />
        </div>
      </section>
    </>
  );
}

function AdminBookings({ busyBookingId, onBookingStatus, rows }) {
  const { t } = useLanguage();
  return (
    <section className="ms-panel mt-6 p-5">
      <h2 className="m-0 font-serif text-3xl text-ink">{t("Gestion de reservas")}</h2>
      <p className="m-0 mt-1 text-sm text-muted">{t("Confirma cupos manualmente mientras se define la pasarela de pagos.")}</p>
      <div className="mt-4">
        <BookingTable busyBookingId={busyBookingId} onBookingStatus={onBookingStatus} rows={rows} />
      </div>
    </section>
  );
}

function AdminPayments({ busyPaymentId, onPaymentAction, rows }) {
  const { t } = useLanguage();
  const paymentRows = rows.filter((row) => row.paymentId);
  return (
    <section className="ms-panel mt-6 p-5">
      <h2 className="m-0 font-serif text-3xl text-ink">{t("Pagos")}</h2>
      <p className="m-0 mt-1 text-sm text-muted">{t("Espacio listo para pagos cuando se defina la pasarela o un metodo manual.")}</p>
      <div className="mt-4">
        <PaymentTable
          busyPaymentId={busyPaymentId}
          onPaymentAction={onPaymentAction}
          rows={paymentRows}
        />
      </div>
    </section>
  );
}

function BookingTable({ busyBookingId, compact = false, onBookingStatus, rows }) {
  const { t } = useLanguage();
  if (!rows.length) {
    return <StateBlock title={t("Sin reservas todavia")} text={t("Cuando exista una reserva, aparecera aqui.")} />;
  }

  return (
    <div className="grid gap-2">
      {rows.map((row) => {
        const busy = busyBookingId === row.id;
        const canConfirm = row.bookingStatus !== "confirmed" && row.bookingStatus !== "cancelled";
        return (
          <article
            key={`booking-${row.id}`}
            className={`ms-admin-row ${compact ? "xl:grid-cols-[1.4fr_.8fr_.7fr_.8fr_auto]" : "xl:grid-cols-[1.4fr_.8fr_.7fr_.8fr_.8fr_auto]"}`}
          >
            <div className="min-w-0">
              <strong className="block truncate text-ink">{row.code}</strong>
              <small className="block truncate text-muted">{row.contactName || ""} - {row.contactEmail || ""}</small>
              <small className="block truncate text-muted">{row.experienceTitle}</small>
              {row.referralPartnerName ? (
                <small className="block truncate font-semibold text-ink">{t("Origen:")} {row.referralPartnerName}</small>
              ) : null}
            </div>
            <span>{row.date} {row.time || ""}</span>
            <span>{row.guests} pax</span>
            <span className="font-bold text-ink">{row.currency || "USD"} {row.total}</span>
            {!compact ? <StatusBadge value={row.paymentStatus} /> : null}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={row.bookingStatus} />
              {canConfirm ? (
                <Button disabled={busy} type="button" onClick={() => onBookingStatus(row.id, "confirmed")}>
                  {busy ? "..." : t("Confirmar")}
                </Button>
              ) : null}
              {row.bookingStatus !== "cancelled" ? (
                <Button disabled={busy} type="button" variant="secondary" onClick={() => onBookingStatus(row.id, "cancelled")}>
                  {t("Cancelar")}
                </Button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PaymentTable({ busyPaymentId, onPaymentAction, rows }) {
  const { t } = useLanguage();
  if (!rows.length) {
    return <StateBlock title={t("Sin pagos por revisar")} text={t("La reserva publica queda activa sin pago obligatorio. Los pagos volveran aqui cuando se active una pasarela o registro manual.")} />;
  }

  return (
    <div className="grid gap-2">
      {rows.map((row) => {
        const busy = busyPaymentId === row.paymentId;
        return (
          <article
            key={`payment-${row.paymentId}`}
            className="ms-admin-row xl:grid-cols-[1.5fr_.8fr_.9fr_.9fr_auto_auto]"
          >
            <div className="min-w-0">
              <strong className="block truncate text-ink">{row.code}</strong>
              <small className="block truncate text-muted">{t("Ref:")} {row.reference || t("pendiente")} - {row.contactName || ""}</small>
            </div>
            <span>{row.currency || "USD"} {row.total}</span>
            <StatusBadge value={row.paymentStatus} />
            <StatusBadge value={row.bookingStatus} />
            <Button
              disabled={busy || row.paymentStatus === "approved"}
              type="button"
              onClick={() => onPaymentAction("approve", row.paymentId)}
            >
              {busy ? "..." : t("Aprobar")}
            </Button>
            <Button
              disabled={busy || row.paymentStatus === "rejected"}
              type="button"
              variant="secondary"
              onClick={() => onPaymentAction("reject", row.paymentId)}
            >
              {t("Rechazar")}
            </Button>
          </article>
        );
      })}
    </div>
  );
}

function StatusChart({ metrics }) {
  const { t } = useLanguage();
  const rows = [
    [t("Pendientes"), metrics.pending, "bg-warn"],
    [t("En revision"), metrics.underReview, "bg-teal"],
    [t("Confirmadas"), metrics.confirmed, "bg-green"],
    [t("Canceladas"), metrics.cancelled, "bg-red"],
  ];

  return (
    <section className="ms-panel p-5">
      <h2 className="m-0 font-serif text-3xl text-ink">{t("Estado de reservas")}</h2>
      <p className="m-0 mt-1 text-sm text-muted">{t("Distribucion operativa para saber que necesita accion.")}</p>
      <div className="mt-5 grid gap-3">
        {rows.map(([label, value, color]) => (
          <MiniBar key={label} color={color} label={label} max={metrics.totalBookings} value={value} />
        ))}
      </div>
    </section>
  );
}

function MiniBar({ color, label, max, value }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-black text-ink">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="ms-minibar">
        <span className={color} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <article className="ms-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function buildMetrics(rows) {
  const contacts = new Set(rows.map((row) => row.contactEmail).filter(Boolean));
  return {
    totalBookings: rows.length,
    pending: rows.filter((row) => row.bookingStatus === "pending").length,
    underReview: rows.filter((row) => row.bookingStatus === "under_review").length,
    confirmed: rows.filter((row) => row.bookingStatus === "confirmed").length,
    cancelled: rows.filter((row) => row.bookingStatus === "cancelled").length,
    pendingPayments: rows.filter(isPendingPayment).length,
    noPayment: rows.filter((row) => row.paymentStatus === "no_payment").length,
    reservationValue: rows.reduce((sum, row) => sum + Number(row.total || 0), 0).toFixed(0),
    guests: contacts.size,
  };
}

function isPendingPayment(row) {
  return row.paymentStatus === "under_review" || row.paymentStatus === "pending";
}
