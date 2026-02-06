import { useState } from "react";
import { Receipt, Menu, Building2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { navigationItems } from "./navigationItems";
import logoSinFondo from "@/images/logoSinFondo.png";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useSucursales } from "@/hooks/useSucursales";
import { PlanesModal } from "@/components/PlanesModal";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MobileNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openPlanesModal, setOpenPlanesModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  const { role } = useUserRole(user?.id);
  const { empresa } = useEmpresa(user?.id);
  const { sucursales, sucursalActual, planInfo, cambiarSucursal } = useSucursales(empresa?.id);
  const roleNormalized = (role || "").toLowerCase();
  const visibleItems = navigationItems.filter((item) =>
    !item.roles || item.roles.includes(roleNormalized)
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  
  const mostrarSelectorSucursales = planInfo.maxSucursales !== 1 && sucursales.length > 1;

  return (
    <>
      <header className="w-full bg-sidebar text-sidebar-foreground shadow-md flex items-center justify-between px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center overflow-hidden">
            <img src={logoSinFondo} alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <span className="font-semibold text-lg">Benefiat</span>
        </div>
        <button
          className="p-2 rounded-md bg-sidebar-accent text-sidebar-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-0 left-0 h-full w-64 bg-sidebar shadow-lg flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center overflow-hidden">
                <img src={logoSinFondo} alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="font-semibold text-lg text-sidebar-foreground">Benefiat</span>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {mostrarSelectorSucursales && (
                <div className="px-4 py-3 mb-2">
                  <label className="text-xs text-sidebar-foreground/60 mb-1 block">Sucursal</label>
                  <Select value={String(sucursalActual)} onValueChange={(val) => cambiarSucursal(Number(val))}>
                    <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <SelectValue placeholder="Seleccionar sucursal" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {sucursales.map((suc) => (
                        <SelectItem key={suc.id} value={String(suc.id)}>
                          {suc.nombre || `Sucursal ${suc.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!planInfo.canCreateMore && (
                    <button 
                      className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground underline mt-2 block"
                      onClick={() => {
                        setMenuOpen(false);
                        setOpenPlanesModal(true);
                      }}
                    >
                      ¿Necesitas más sucursales? Actualiza tu plan
                    </button>
                  )}
                </div>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-sidebar-border">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 rounded-lg bg-white text-[#00679F] border border-[#00679F] hover:bg-[#00679F] hover:text-white font-semibold shadow transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
      <PlanesModal open={openPlanesModal} onOpenChange={setOpenPlanesModal} />
    </>
  );
}
