import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useClientes(empresaId) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[useClientes] useEffect triggered. empresaId:', empresaId);
    if (!empresaId) {
      console.log('[useClientes] empresaId is falsy, consulta NO ejecutada');
      return;
    }
    setLoading(true);
    supabase
      .from("user")
      .select('tablaID, nombre, apellido, email')
      .eq("empresa", empresaId)
      .then(({ data, error }) => {
        console.log('[useClientes] data:', data, 'error:', error);
        setClientes(data || []);
        setError(error);
        setLoading(false);
      });
  }, [empresaId]);

  return { clientes, loading, error };
}
