import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useClientes(empresaId) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    supabase
      .from("user")
      .select("tablaID, nombre, email")
      .eq("empresa", empresaId)
      .then(({ data, error }) => {
        setClientes(data || []);
        setError(error);
        setLoading(false);
      });
  }, [empresaId]);

  return { clientes, loading, error };
}
