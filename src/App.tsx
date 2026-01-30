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
import { RequireAuth } from "@/components/RequireAuth";

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
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/documentos"
            element={
              <RequireAuth>
                <Documentos />
              </RequireAuth>
            }
          />
          <Route
            path="/clientes"
            element={
              <RequireAuth>
                <Clientes />
              </RequireAuth>
            }
          />
          <Route
            path="/productos"
            element={
              <RequireAuth>
                <Productos />
              </RequireAuth>
            }
          />
          <Route
            path="/configuracion"
            element={
              <RequireAuth>
                <Configuracion />
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
                <ReporteMensual />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
