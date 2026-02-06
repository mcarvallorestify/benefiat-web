
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  Receipt,
  ShoppingCart,
} from "lucide-react";

export const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["administrador"] },
  { name: "Punto de Venta", href: "/punto-de-venta", icon: ShoppingCart, roles: ["administrador", "vendedor", "bodeguero"] },
  { name: "Documentos", href: "/documentos", icon: FileText, roles: ["administrador", "contador"] },
  { name: "Clientes", href: "/clientes", icon: Users, roles: ["administrador", "contador"] },
  { name: "Productos", href: "/productos", icon: Package, roles: ["administrador", "bodeguero"] },
  { name: "Configuración", href: "/configuracion", icon: Settings, roles: ["administrador"] },
];
