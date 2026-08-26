export function Button({ children, variant = "primary", className = "", ...props }) {
  const variantClass = variant === "secondary" ? "ms-button-secondary" : "ms-button-primary";
  return (
    <button className={`ms-button ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
