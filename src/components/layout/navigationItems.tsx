
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
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Punto de Venta", href: "/punto-de-venta", icon: ShoppingCart },
  { name: "Documentos", href: "/documentos", icon: FileText },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Configuración", href: "/configuracion", icon: Settings },
];
