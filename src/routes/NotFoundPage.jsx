import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="ms-page">
      <div className="ms-panel p-6">
        <p className="ms-eyebrow">404</p>
        <h1 className="font-serif text-4xl text-ink">Ruta no encontrada</h1>
        <p className="mt-2 text-muted">Vuelve al catalogo para continuar.</p>
        <Link className="ms-button ms-button-primary mt-5" to="/experiencias">Ir a experiencias</Link>
      </div>
    </section>
  );
}
