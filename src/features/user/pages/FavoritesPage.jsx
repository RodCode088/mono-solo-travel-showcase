import { Link } from "react-router-dom";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { db } from "../../../data/db.js";
import { FallingExperienceGrid } from "../../catalog/components/index.js";
import { useFavorites } from "../../catalog/hooks/useFavorites.js";

export function FavoritesPage() {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const experiences = db.experiences.filter((experience) => favoriteIds.has(experience.id));

  return (
    <>
      <section className="ms-panel p-5">
        <p className="ms-eyebrow">Area de cliente</p>
        <h1 className="m-0 font-serif text-[clamp(28px,4vw,40px)] text-ink">Favoritos</h1>
        <p className="m-0 text-muted">Experiencias que guardaste para revisar despues.</p>
      </section>

      <div className="mt-4">
        {experiences.length ? (
          <FallingExperienceGrid
            experiences={experiences}
            favoriteIds={favoriteIds}
            onFavorite={toggleFavorite}
            className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          />
        ) : (
          <section className="ms-panel p-5">
            <StateBlock
              title="Todavia no tienes favoritos"
              text="Toca el corazon en cualquier experiencia para guardarla aqui."
            />
            <Link className="ms-button ms-button-primary mt-4 w-fit" to="/experiencias?reset=1">
              Ver experiencias
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
