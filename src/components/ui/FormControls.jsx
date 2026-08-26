import { CalendarDays, ChevronDown, Users } from "lucide-react";

export function SelectControl({ children, className = "", ...props }) {
  return (
    <span className="ms-control-shell">
      <select className={`ms-select-control ${className}`} {...props}>{children}</select>
      <ChevronDown className="ms-control-icon" size={18} aria-hidden="true" />
    </span>
  );
}

export function DateControl({ className = "", ...props }) {
  return (
    <span className="ms-control-shell ms-date-shell">
      <CalendarDays className="ms-control-leading-icon" size={18} aria-hidden="true" />
      <input className={`ms-date-control ${className}`} type="date" {...props} />
    </span>
  );
}

export function NumberControl({ className = "", ...props }) {
  return (
    <span className="ms-control-shell">
      <Users className="ms-control-leading-icon" size={18} aria-hidden="true" />
      <input className={`ms-number-control ${className}`} type="number" {...props} />
    </span>
  );
}
