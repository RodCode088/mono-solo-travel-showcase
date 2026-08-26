import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";

/**
 * Campo de texto con etiqueta flotante y estado de foco propio.
 *
 * Reemplaza al par `<label> + <input>` suelto de los formularios de acceso: la
 * etiqueta sube al escribir, el icono opcional queda dentro de la caja y el
 * error se muestra pegado al campo en vez de al final del formulario.
 */
export function TextField({
  name,
  label,
  type = "text",
  icon: Icon = null,
  hint = null,
  error = null,
  value,
  onChange,
  defaultValue,
  ...props
}) {
  const id = useId();
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState(defaultValue ?? "");
  const current = isControlled ? value : innerValue;

  return (
    <div className="ms-textfield" data-invalid={error ? "" : undefined}>
      <div className="ms-textfield-box">
        {Icon ? <Icon className="ms-textfield-icon" size={17} aria-hidden="true" /> : null}
        <input
          id={id}
          name={name}
          type={type}
          placeholder=" "
          value={current}
          onChange={(event) => {
            if (!isControlled) setInnerValue(event.target.value);
            onChange?.(event);
          }}
          {...props}
        />
        <label htmlFor={id}>{label}</label>
      </div>
      {error ? <p className="ms-textfield-error">{error}</p> : hint ? <p className="ms-textfield-hint">{hint}</p> : null}
    </div>
  );
}

/** Igual que TextField, con boton para revelar la contrasena. */
export function PasswordField({ label, hint = null, error = null, ...props }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  return (
    <div className="ms-textfield" data-invalid={error ? "" : undefined}>
      <div className="ms-textfield-box">
        <PasswordInner label={label} visible={visible} {...props} />
        <button
          className="ms-textfield-reveal"
          type="button"
          aria-label={t(visible ? "Ocultar contrasena" : "Mostrar contrasena")}
          title={t(visible ? "Ocultar contrasena" : "Mostrar contrasena")}
          onClick={() => setVisible((state) => !state)}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {error ? <p className="ms-textfield-error">{error}</p> : hint ? <p className="ms-textfield-hint">{hint}</p> : null}
    </div>
  );
}

function PasswordInner({ label, visible, ...props }) {
  const id = useId();
  return (
    <>
      <input id={id} type={visible ? "text" : "password"} placeholder=" " {...props} />
      <label htmlFor={id}>{label}</label>
    </>
  );
}
