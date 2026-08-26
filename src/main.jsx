import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles/react.css";
// Se carga despues de react.css a proposito: el pase de diseno gana sobre las
// capas de Tailwind sin tener que subir especificidad. Ver design-pass.css.
import "./styles/design-pass.css";
import "./styles/ui-kit.css";
import "./styles/panels.css";

createRoot(document.getElementById("react-root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
