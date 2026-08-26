import { Star } from "lucide-react";

export function StarRating({ value = 0, count, size = 16, interactive = false, onChange }) {
  const rounded = Math.round(Number(value) || 0);

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="inline-flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rounded;
          if (!interactive) {
            return (
              <Star
                key={star}
                width={size}
                height={size}
                className={filled ? "fill-gold text-gold" : "fill-none text-line"}
                strokeWidth={1.6}
                aria-hidden="true"
              />
            );
          }
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === rounded}
              aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
              className="border-0 bg-transparent p-0.5"
              onClick={() => onChange?.(star)}
            >
              <Star
                width={size}
                height={size}
                className={filled ? "fill-gold text-gold" : "fill-none text-line"}
                strokeWidth={1.6}
              />
            </button>
          );
        })}
      </div>
      {count != null ? <span className="text-xs font-bold text-muted">({count})</span> : null}
    </div>
  );
}
