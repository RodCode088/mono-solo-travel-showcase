import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { state } from "../../../lib/services/state.js";
import { toggleFavorite as toggleFavoriteService } from "../../../lib/services/favorites-service.js";

// state.favorites es un Set a nivel de modulo (no React state), asi que los
// componentes necesitan un disparador de re-render despues de una mutacion.
// Centralizado aca en vez de que cada pagina mantenga su propio contador dummy.
export function useFavorites() {
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  const toggleFavorite = useCallback(
    async (experienceId) => {
      const { error } = await toggleFavoriteService(experienceId);
      if (error?.code === "NOT_AUTHENTICATED") {
        navigate("/login");
        return;
      }
      setTick((value) => value + 1);
    },
    [navigate],
  );

  return { favoriteIds: state.favorites, toggleFavorite };
}
