import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useEmpresa(creatorUuid) {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!creatorUuid) return;
    setLoading(true);
    supabase
      .from("empresa")
      .select("*")
      .eq("creador", creatorUuid)
      .single()
      .then(({ data, error }) => {
        setEmpresa(data);
        setError(error);
        setLoading(false);
      });
  }, [creatorUuid]);

  return { empresa, loading, error };
}
