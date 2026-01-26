import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNavbar } from "./MobileNavbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
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
    </div>
  );
}
