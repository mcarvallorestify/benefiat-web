import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface PlanInfo {
  planId: number | null;
  maxSucursales: number | null; // null = ilimitadas
  canCreateMore: boolean;
  estado?: string; // Puede ser 'Activo', 'Dado de baja', etc.
}

export function useSucursales(empresaId: number | null) {
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [sucursalActual, setSucursalActual] = useState<number | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo>({
    planId: null,
    maxSucursales: 1,
    canCreateMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Obtener el plan asociado a la empresa, incluyendo el estado
        const { data: planEmpresa, error: planError } = await supabase
          .from("plan_empresa")
          .select("plan_asociado, estado")
          .eq("empresa", empresaId)
          .single();

        if (planError) throw planError;

        const planId = planEmpresa?.plan_asociado;
        let maxSucursales = 1;

        // 2. Determinar límite de sucursales según el plan
        if (planId === 10 || planId === 11) {
          maxSucursales = 1;
        } else if (planId === 12 || planId === 13) {
          maxSucursales = 3;
        } else if (planId === 14 || planId === 15) {
          maxSucursales = null; // ilimitadas
        }

        // 3. Obtener sucursales de la empresa
        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from("Sucursal")
          .select("*")
          .eq("empresa", empresaId);

        if (sucursalesError) throw sucursalesError;

        const sucursalesList = sucursalesData || [];
        setSucursales(sucursalesList);

        // 4. Determinar si se pueden crear más sucursales
        const canCreateMore =
          maxSucursales === null || sucursalesList.length < maxSucursales;

        setPlanInfo({
          planId,
          maxSucursales,
          canCreateMore,
          estado: planEmpresa?.estado || undefined,
        });

        // 5. Establecer sucursal actual (por defecto la primera)
        const storedSucursal = localStorage.getItem(`sucursal_actual_${empresaId}`);
        if (storedSucursal && sucursalesList.some(s => s.id === Number(storedSucursal))) {
          setSucursalActual(Number(storedSucursal));
        } else if (sucursalesList.length > 0) {
          setSucursalActual(sucursalesList[0].id);
          localStorage.setItem(`sucursal_actual_${empresaId}`, String(sucursalesList[0].id));
        }

        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    loadData();
  }, [empresaId]);

  const cambiarSucursal = (sucursalId: number) => {
    setSucursalActual(sucursalId);
    if (empresaId) {
      localStorage.setItem(`sucursal_actual_${empresaId}`, String(sucursalId));
    }
  };

  const reloadSucursales = async () => {
    if (!empresaId) return;
    
    const { data: sucursalesData } = await supabase
      .from("Sucursal")
      .select("*")
      .eq("empresa", empresaId);

    const sucursalesList = sucursalesData || [];
    setSucursales(sucursalesList);

    // Actualizar si se pueden crear más
    const canCreateMore =
      planInfo.maxSucursales === null || sucursalesList.length < planInfo.maxSucursales;
    
    setPlanInfo(prev => ({
      ...prev,
      canCreateMore,
    }));
  };

  return {
    sucursales,
    sucursalActual,
    planInfo,
    loading,
    error,
    cambiarSucursal,
    reloadSucursales,
  };
}
