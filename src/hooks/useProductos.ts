import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useProductos(empresaId) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    supabase
      .from("Producto")
      .select("*")
      .eq("empresa", empresaId)
      .then(({ data, error }) => {
        setProductos(data || []);
        setError(error);
        setLoading(false);
      });
  }, [empresaId]);

  return { productos, loading, error };
}
