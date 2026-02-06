import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNavbar } from "./MobileNavbar";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useSucursales } from "@/hooks/useSucursales";
import { SucursalSelectorModal } from "@/components/SucursalSelectorModal";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);
  const { sucursales, sucursalActual, cambiarSucursal } = useSucursales(empresa?.id);
  const [openSucursalModal, setOpenSucursalModal] = useState(false);
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null);

  useEffect(() => {
    if (sucursalActual) {
      setSelectedSucursalId(sucursalActual);
    } else if (sucursales.length > 0) {
      setSelectedSucursalId(sucursales[0].id);
    }
  }, [sucursalActual, sucursales]);

  useEffect(() => {
    if (!user) return;
    
    const pending = sessionStorage.getItem("sucursal_modal_pending") === "1";
    if (pending && sucursales.length > 0) {
      setOpenSucursalModal(true);
    } else if (pending && sucursales.length === 0) {
      // Las sucursales aún se están cargando, esperar
      return;
    } else if (!pending && sucursales.length > 0) {
      // Si no hay flag pendiente y las sucursales ya se cargaron, limpiar
      sessionStorage.removeItem("sucursal_modal_pending");
    }
  }, [user, sucursales]);

  const handleConfirmSucursal = () => {
    if (!selectedSucursalId) return;
    cambiarSucursal(selectedSucursalId);
    sessionStorage.removeItem("sucursal_modal_pending");
    setOpenSucursalModal(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar desktop */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      {/* Navbar móvil con botón de menú */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
      <main className="flex-1 p-4 md:p-8 transition-all duration-200">
        {children}
      </main>
      <SucursalSelectorModal
        open={openSucursalModal}
        onOpenChange={setOpenSucursalModal}
        sucursales={sucursales}
        selectedSucursalId={selectedSucursalId}
        onSelectSucursal={setSelectedSucursalId}
        onConfirm={handleConfirmSucursal}
        disableClose
      />
    </div>
  );
}
