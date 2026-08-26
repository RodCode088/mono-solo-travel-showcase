import { useEffect, useRef, useState } from "react";
import { ExperienceCard } from "./ExperienceCard.jsx";

const landingPatterns = [
  { x: "-28px", mid: "4px", rotate: "-5deg" },
  { x: "22px", mid: "-3px", rotate: "4deg" },
  { x: "-16px", mid: "3px", rotate: "3deg" },
  { x: "26px", mid: "-4px", rotate: "-4deg" },
  { x: "-22px", mid: "4px", rotate: "4deg" },
  { x: "18px", mid: "-3px", rotate: "-3deg" },
];

export function FallingExperienceGrid({ experiences, favoriteIds, onFavorite, className = "" }) {
  return (
    <div className={`ms-tetris-grid ${className}`}>
      {experiences.map((experience, index) => (
        <FallingExperienceCard
          key={experience.id}
          experience={experience}
          favorite={favoriteIds?.has(experience.id)}
          index={index}
          onFavorite={onFavorite}
        />
      ))}
    </div>
  );
}

function FallingExperienceCard({ experience, favorite, index, onFavorite }) {
  const ref = useRef(null);
  const [landed, setLanded] = useState(false);
  const pattern = landingPatterns[index % landingPatterns.length];

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (!("IntersectionObserver" in window)) {
      setLanded(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLanded(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ms-tetris-piece ${landed ? "is-landed" : ""}`}
      style={{
        "--ms-piece-delay": `${(index % 6) * 55}ms`,
        "--ms-piece-x": pattern.x,
        "--ms-piece-mid-x": pattern.mid,
        "--ms-piece-rotate": pattern.rotate,
      }}
    >
      <ExperienceCard experience={experience} favorite={favorite} onFavorite={onFavorite} />
    </div>
  );
}
