import { useEffect, useRef, useState } from "react";

/**
 * Popover flotante y accesible para calendarios y menus.
 *
 * Devuelve el estado abierto/cerrado y dos refs: `anchorRef` para el disparador
 * y `panelRef` para el panel. Cierra con Escape, con clic fuera y cuando el
 * foco sale del conjunto; `placement` avisa si hubo que voltearlo hacia arriba
 * porque no cabia debajo.
 */
export function usePopover({ onClose } = {}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState("bottom");
  const anchorRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const close = () => {
      setOpen(false);
      onClose?.();
    };

    const onPointerDown = (event) => {
      if (anchorRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      close();
    };

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      close();
      anchorRef.current?.querySelector("button, [tabindex]")?.focus?.();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // Voltea el panel hacia arriba cuando el disparador esta cerca del borde
  // inferior del viewport, que es lo normal en el widget de reserva.
  useEffect(() => {
    if (!open) return undefined;

    const measure = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const needed = panel.offsetHeight + 16;
      const roomBelow = window.innerHeight - rect.bottom;
      setPlacement(roomBelow < needed && rect.top > needed ? "top" : "bottom");
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  return { open, setOpen, placement, anchorRef, panelRef };
}
