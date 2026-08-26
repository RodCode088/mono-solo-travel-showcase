export function MonkeyAvatarIcon({ className = "h-full w-full" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="15" cy="18" r="10" />
      <circle cx="49" cy="18" r="10" />
      <circle cx="32" cy="34" r="22" />
      <ellipse cx="32" cy="40" rx="12" ry="10" opacity="0.35" />
      <circle cx="25" cy="30" r="2.6" />
      <circle cx="39" cy="30" r="2.6" />
    </svg>
  );
}
