import { NavLink } from "react-router-dom";
import { Receipt } from "lucide-react";
import { navigationItems } from "./navigationItems";
import logoSinFondo from "@/images/logoSinFondo.png";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export function Navbar() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
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
        {navigationItems.map((item) => (
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
          className="ml-4 px-4 py-2 rounded-lg bg-[#00679F] hover:bg-[#005377] text-white font-semibold shadow transition"
        >
          Cerrar sesión
        </button>
      </nav>
    </header>
  );
}
