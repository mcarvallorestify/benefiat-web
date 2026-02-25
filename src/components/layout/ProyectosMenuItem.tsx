import { NavLink } from "react-router-dom";
import { Folder } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";

export function ProyectosMenuItem() {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);

  if (empresa?.id !== 104 && empresa?.id !== 78) return null;

  return (
    <NavLink
      to="/proyectos"
      className="sidebar-item sidebar-item-inactive"
      style={{ display: "flex", alignItems: "center", gap: 8 }}
    >
      <Folder className="w-5 h-5" />
      <span className="font-medium">Proyectos</span>
    </NavLink>
  );
}
