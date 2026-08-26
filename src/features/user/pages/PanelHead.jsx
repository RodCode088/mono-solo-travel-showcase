/**
 * Cabecera comun de las pantallas de panel (cliente y admin).
 *
 * Cada pagina repetia su propio bloque `ms-panel` con eyebrow, h1 y bajada,
 * cada una con medidas ligeramente distintas. Esto las alinea y deja un hueco
 * a la derecha para la accion principal de la pantalla.
 */
export function PanelHead({ eyebrow, title, lead, actions = null }) {
  return (
    <header className="ms-panel-head">
      <div className="min-w-0">
        {eyebrow ? <p className="ms-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {lead ? <p className="ms-panel-head-lead">{lead}</p> : null}
      </div>
      {actions ? <div className="ms-panel-head-actions">{actions}</div> : null}
    </header>
  );
}
