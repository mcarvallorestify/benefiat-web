import { useState } from "react";
import { Receipt, Menu } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { navigationItems } from "./navigationItems";
import logoSinFondo from "@/images/logoSinFondo.png";
import { supabase } from "@/lib/supabaseClient";

export function MobileNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

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
              {navigationItems.map((item) => (
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
              <button
                onClick={handleLogout}
                className="mt-6 w-full px-4 py-2 rounded-lg bg-[#00679F] hover:bg-[#005377] text-white font-semibold shadow transition"
              >
                Cerrar sesión
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
