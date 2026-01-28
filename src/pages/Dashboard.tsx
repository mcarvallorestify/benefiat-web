import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import { FileText, Receipt, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);

  const [facturasCount, setFacturasCount] = useState<number | null>(null);
  const [boletasCount, setBoletasCount] = useState<number | null>(null);
  const [clientesCount, setClientesCount] = useState<number | null>(null);
  const [ventasMes, setVentasMes] = useState<number | null>(null);

  useEffect(() => {
    if (!empresa?.id) {
      setFacturasCount(null);
      setBoletasCount(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        // rango del mes actual
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

        // contar facturas y boletas dentro del mes (intentar por fechaEmision, fallback a created_at)
        const resFacturas = await supabase
          .from('documentosEmitidos')
          .select('id', { count: 'exact' })
          .eq('tipoDocumento', 33)
          .eq('empresa', empresa.id)
          .gte('fechaEmision', start)
          .lt('fechaEmision', end);
        if (resFacturas.error) {
          const alt = await supabase
            .from('documentosEmitidos')
            .select('id', { count: 'exact' })
            .eq('tipoDocumento', 33)
            .eq('empresa', empresa.id)
            .gte('created_at', start)
            .lt('created_at', end);
          if (alt.error) {
            console.error('Error cargando facturas (fechaEmision/created_at):', resFacturas.error, alt.error);
            setFacturasCount(0);
          } else {
            setFacturasCount(alt.count ?? 0);
          }
        } else {
          setFacturasCount(resFacturas.count ?? 0);
        }

        const resBoletas = await supabase
          .from('documentosEmitidos')
          .select('id', { count: 'exact' })
          .eq('tipoDocumento', 39)
          .eq('empresa', empresa.id)
          .gte('fechaEmision', start)
          .lt('fechaEmision', end);
        if (resBoletas.error) {
          const alt = await supabase
            .from('documentosEmitidos')
            .select('id', { count: 'exact' })
            .eq('tipoDocumento', 39)
            .eq('empresa', empresa.id)
            .gte('created_at', start)
            .lt('created_at', end);
          if (alt.error) {
            console.error('Error cargando boletas (fechaEmision/created_at):', resBoletas.error, alt.error);
            setBoletasCount(0);
          } else {
            setBoletasCount(alt.count ?? 0);
          }
        } else {
          setBoletasCount(resBoletas.count ?? 0);
        }

        // clientes (conteo total filtrado por empresa)
        const resClientes = await supabase.from('user').select('tablaID', { count: 'exact' }).eq('empresa', empresa.id);
        if (resClientes && resClientes.error) {
          console.error('Error cargando clientes:', resClientes.error);
          setClientesCount(0);
        } else {
          setClientesCount(resClientes?.count ?? 0);
        }

        // Ventas del mes: sumar columna 'monto' en documentosEmitidos filtrado por empresa y mes actual
        const resMontos = await supabase
          .from('documentosEmitidos')
          .select('monto')
          .eq('empresa', empresa.id)
          .gte('fechaEmision', start)
          .lt('fechaEmision', end);
        let rows = resMontos.data || [];
        if (resMontos.error) {
          const resAlt = await supabase
            .from('documentosEmitidos')
            .select('monto')
            .eq('empresa', empresa.id)
            .gte('created_at', start)
            .lt('created_at', end);
          if (resAlt.error) {
            console.error('Error cargando montos (fechaEmision y created_at):', resMontos.error, resAlt.error);
            setVentasMes(0);
          } else {
            rows = resAlt.data || [];
            const sum = (rows || []).reduce((s, r) => s + Number(r?.monto || 0), 0);
            setVentasMes(sum);
          }
        } else {
          const sum = (rows || []).reduce((s, r) => s + Number(r?.monto || 0), 0);
          setVentasMes(sum);
        }
      } catch (e) {
        console.error('Error fetching documentos counts', e);
      }
    })();
    return () => { mounted = false; };
  }, [empresa?.id]);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-subtitle mt-1">Resumen de tu actividad de facturación</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Ventas del Mes"
            value={ventasMes !== null ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(ventasMes)) : '...'}
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-success/10 text-success"
          />
          <StatsCard
            title="Facturas Emitidas"
            value={facturasCount !== null ? String(facturasCount) : '...'}
            changeType="neutral"
            icon={FileText}
            iconColor="bg-primary/10 text-primary"
          />
          <StatsCard
            title="Boletas Emitidas"
            value={boletasCount !== null ? String(boletasCount) : '...'}
            changeType="positive"
            icon={Receipt}
            iconColor="bg-secondary/30 text-secondary-foreground"
          />
          <StatsCard
            title="Clientes"
            value={clientesCount !== null ? String(clientesCount) : '...'}
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
