import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Documentos from "./pages/Documentos";
import Clientes from "./pages/Clientes";
import Productos from "./pages/Productos";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";
import PuntoDeVenta from "./pages/PuntoDeVenta";
import Login from "./pages/Login";
import ReporteMensual from "./pages/ReporteMensual";
import CrearCuenta from "./pages/CrearCuenta";
import Proyectos from "./pages/Proyectos";
import Caja from "./pages/Caja";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireRole } from "@/components/RequireRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/crear-cuenta" element={<CrearCuenta />} />
          {/* Rutas para Administrador */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <RoleRedirect />
              </RequireAuth>
            }
          />
          <Route
            path="/documentos"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador"]}>
                  <Documentos />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/restauranteMesas"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador","Vendedor"]}>
                  <RestauranteMesas />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/clientes"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador"]}>
                  <Clientes />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/productos"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador", "Bodeguero"]}>
                  <Productos />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/configuracion"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador"]}>
                  <Configuracion />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/punto-de-venta"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador", "Vendedor"]}>
                  <PuntoDeVenta />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/caja"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador"]}>
                  <Caja />
                </RequireRole>
              </RequireAuth>
            }
          />
          {/* Rutas para Contador: solo ReporteMensual */}
          <Route
            path="/reporte-mensual"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Contador", "Administrador"]}>
                  <ReporteMensual />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/proyectos"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador"]}>
                  <Proyectos />
                </RequireRole>
              </RequireAuth>
            }
          />
          {/* Redirección para Contador: si accede a otra ruta, NotFound */}
          <Route
            path="*"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Contador"]}>
                  <NotFound />
                </RequireRole>
                <RequireRole allowedRoles={["Administrador", "Vendedor", "Bodeguero", "Cliente"]}>
                  <NotFound />
                </RequireRole>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
// Redirección según rol
import { useUser } from "@/hooks/useUser";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import RestauranteMesas from "./pages/RestauranteMesas";

function RoleRedirect() {
  const { user } = useUser();
  const { role } = useUserRole(user?.id);
  if (!role) return null;
  switch (role) {
    case "Administrador":
      return <Dashboard />;
    case "Vendedor":
    case "Bodeguero":
      return <Navigate to="/punto-de-venta" />;
    case "Contador":
      return <Navigate to="/reporte-mensual" />;
    default:
      return <Navigate to="/login" />;
  }
}
