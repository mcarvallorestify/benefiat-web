import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { FileText, Receipt, Users, TrendingUp } from "lucide-react";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-subtitle mt-1">Resumen de tu actividad de facturación</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Ventas del Mes"
            value="$4.520.000"
            change="+12.5% vs mes anterior"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-success/10 text-success"
          />
          <StatsCard
            title="Facturas Emitidas"
            value="45"
            change="8 pendientes de pago"
            changeType="neutral"
            icon={FileText}
            iconColor="bg-primary/10 text-primary"
          />
          <StatsCard
            title="Boletas Emitidas"
            value="234"
            change="+18% vs mes anterior"
            changeType="positive"
            icon={Receipt}
            iconColor="bg-secondary/30 text-secondary-foreground"
          />
          <StatsCard
            title="Clientes Activos"
            value="89"
            change="5 nuevos este mes"
            changeType="positive"
            icon={Users}
            iconColor="bg-accent/30 text-accent-foreground"
          />
        </div>

        {/* Recent Documents */}
        <RecentDocuments />
      </div>
    </AppLayout>
  );
}
