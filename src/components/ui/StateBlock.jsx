const toneClass = {
  default: "border-line bg-surface-2 text-ink-2",
  error: "border-red bg-red/10 text-red",
  success: "border-green bg-green/10 text-green",
};

export function StateBlock({ title, text, tone = "default" }) {
  return (
    <div className={`rounded-ms border p-5 ${toneClass[tone] || toneClass.default}`}>
      <strong className="block text-ink">{title}</strong>
      {text ? <p className="mt-2">{text}</p> : null}
    </div>
  );
}
