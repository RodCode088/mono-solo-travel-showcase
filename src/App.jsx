import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext.jsx";
import { appRouter } from "./routes/AppRouter.jsx";

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={appRouter} />
    </AuthProvider>
  );
}
