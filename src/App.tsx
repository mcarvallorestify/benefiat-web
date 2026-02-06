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
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador"]}>
                  <Dashboard />
                </RequireRole>
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
                <RequireRole allowedRoles={["Administrador"]}>
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
                <PuntoDeVenta />
              </RequireAuth>
            }
          />
          <Route
            path="/reporte-mensual"
            element={
              <RequireAuth>
                <RequireRole allowedRoles={["Administrador"]}>
                  <ReporteMensual />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/crear-cuenta"
            element={<CrearCuenta />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
