import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLoginPage } from "../features/admin/pages/AdminLoginPage.jsx";
import { AdminRoutePage } from "../features/admin/pages/AdminRoutePage.jsx";
import { AdminExperiencesPage } from "../features/admin/pages/AdminExperiencesPage.jsx";
import { AdminAvailabilityPage } from "../features/admin/pages/AdminAvailabilityPage.jsx";
import { AdminCalendarPage } from "../features/admin/pages/AdminCalendarPage.jsx";
import { AdminCustomersPage } from "../features/admin/pages/AdminCustomersPage.jsx";
import { AdminReportsPage } from "../features/admin/pages/AdminReportsPage.jsx";
import { AdminSettingsPage } from "../features/admin/pages/AdminSettingsPage.jsx";
import { AdminLayout } from "../features/admin/components/AdminLayout.jsx";
import { RequireAdmin } from "../features/admin/components/RequireAdmin.jsx";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage.jsx";
import { LoginPage } from "../features/auth/pages/LoginPage.jsx";
import { RegisterPage } from "../features/auth/pages/RegisterPage.jsx";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage.jsx";
import { BookingSelectionPage } from "../features/booking/pages/BookingSelectionPage.jsx";
import { CheckoutPage } from "../features/booking/pages/CheckoutPage.jsx";
import { ConfirmationPage } from "../features/booking/pages/ConfirmationPage.jsx";
import { CatalogPage } from "../features/catalog/pages/CatalogPage.jsx";
import { AboutPage } from "../features/catalog/pages/AboutPage.jsx";
import { DestinationsPage } from "../features/catalog/pages/DestinationsPage.jsx";
import { ExperienceDetailPage } from "../features/catalog/pages/ExperienceDetailPage.jsx";
import { HomePage } from "../features/catalog/pages/HomePage.jsx";
import { VlogPage } from "../features/catalog/pages/VlogPage.jsx";
import { LegalPage } from "../features/legal/pages/LegalPage.jsx";
import { RequireCustomer } from "../features/user/components/RequireCustomer.jsx";
import { FavoritesPage } from "../features/user/pages/FavoritesPage.jsx";
import { UserBookingsPage } from "../features/user/pages/UserBookingsPage.jsx";
import { UserCalendarPage } from "../features/user/pages/UserCalendarPage.jsx";
import { UserDashboardPage } from "../features/user/pages/UserDashboardPage.jsx";
import { UserLayout } from "../features/user/pages/UserLayout.jsx";
import { UserProfilePage } from "../features/user/pages/UserProfilePage.jsx";
import { NotFoundPage } from "./NotFoundPage.jsx";
import { RootLayout } from "./RootLayout.jsx";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "experiencias", element: <CatalogPage /> },
      { path: "conocenos", element: <AboutPage /> },
      { path: "vlog", element: <VlogPage /> },
      { path: "experiencias/:slug", element: <ExperienceDetailPage /> },
      { path: "destinos", element: <DestinationsPage /> },
      { path: "destinos/:slug", element: <DestinationsPage /> },
      {
        element: <RequireCustomer />,
        children: [
          { path: "reservar/:experienceId", element: <BookingSelectionPage /> },
          { path: "checkout", element: <CheckoutPage /> },
        ],
      },
      { path: "confirmacion", element: <ConfirmationPage /> },
      { path: "legal/terminos", element: <LegalPage doc="terminos" /> },
      { path: "legal/privacidad", element: <LegalPage doc="privacidad" /> },
      { path: "legal/cancelacion", element: <LegalPage doc="cancelacion" /> },
      { path: "legal/exencion", element: <LegalPage doc="exencion" /> },
      { path: "admin/login", element: <AdminLoginPage /> },
      {
        path: "admin",
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: "dashboard", element: <AdminRoutePage section="dashboard" /> },
              { path: "reservas", element: <AdminRoutePage section="reservas" /> },
              { path: "calendario", element: <AdminCalendarPage /> },
              { path: "pagos", element: <AdminRoutePage section="pagos" /> },
              { path: "experiencias", element: <AdminExperiencesPage /> },
              { path: "experiencias/nueva", element: <AdminExperiencesPage create /> },
              { path: "clientes", element: <AdminCustomersPage /> },
              { path: "disponibilidad", element: <AdminAvailabilityPage /> },
              { path: "reportes", element: <AdminReportsPage /> },
              { path: "configuracion", element: <AdminSettingsPage /> },
            ],
          },
        ],
      },
      { path: "login", element: <LoginPage /> },
      { path: "registro", element: <RegisterPage /> },
      { path: "recuperar", element: <ForgotPasswordPage /> },
      { path: "usuario/nueva-clave", element: <ResetPasswordPage /> },
      {
        path: "usuario",
        element: <RequireCustomer />,
        children: [
          {
            element: <UserLayout />,
            children: [
              { index: true, element: <Navigate replace to="/usuario/dashboard" /> },
              { path: "dashboard", element: <UserDashboardPage /> },
              { path: "reservas", element: <UserBookingsPage /> },
              { path: "calendario", element: <UserCalendarPage /> },
              { path: "favoritos", element: <FavoritesPage /> },
              { path: "perfil", element: <UserProfilePage /> },
              { path: "*", element: <Navigate replace to="/usuario/dashboard" /> },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
