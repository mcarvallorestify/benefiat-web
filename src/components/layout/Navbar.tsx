import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Receipt, Building2 } from "lucide-react";
import { navigationItems } from "./navigationItems";
import logoSinFondo from "@/images/logoSinFondo.png";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
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

export function Navbar() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { role } = useUserRole(user?.id);
  const { empresa } = useEmpresa(user?.id);
  const { sucursales, sucursalActual, planInfo, cambiarSucursal } = useSucursales(empresa?.id);
  const [openPlanesModal, setOpenPlanesModal] = useState(false);
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
    <header className="w-full bg-sidebar text-sidebar-foreground shadow-md flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center overflow-hidden">
          <img src={logoSinFondo} alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Benefiat</h1>
          <p className="text-xs text-sidebar-foreground/60">Sistema de Facturación</p>
        </div>
      </div>
      <nav className="flex gap-6 items-center">
        {mostrarSelectorSucursales && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <Select value={String(sucursalActual)} onValueChange={(val) => cambiarSucursal(Number(val))}>
              <SelectTrigger className="w-[200px] bg-sidebar-accent border-sidebar-border">
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {sucursales.map((suc) => (
                  <SelectItem key={suc.id} value={String(suc.id)}>
                    {suc.nombre || `Sucursal ${suc.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>            {!planInfo.canCreateMore && (
              <a 
                href="#" 
                className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground underline whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/configuracion';
                }}
              >
                ¿Necesitas más? Actualiza tu plan
              </a>
            )}          </div>
        )}
      
        {visibleItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors font-medium ${
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="ml-4 px-4 py-2 rounded-lg bg-white text-[#00679F] border border-[#00679F] hover:bg-[#00679F] hover:text-white font-semibold shadow transition"
        >
          Cerrar sesión
        </button>
      </nav>
    </header>
  );
}
