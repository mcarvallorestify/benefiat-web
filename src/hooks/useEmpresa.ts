import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useEmpresa(creatorUuid) {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!creatorUuid) return;
    setLoading(true);
    
    // Primero obtener el campo empresa del usuario
    supabase
      .from("user")
      .select("empresa")
      .eq("tablaID", creatorUuid)
      .single()
      .then(({ data: userData, error: userError }) => {
        if (userError || !userData?.empresa) {
          setError(userError);
          setLoading(false);
          return;
        }
        
        // Luego buscar la empresa por el ID del usuario
        supabase
          .from("empresa")
          .select("*")
          .eq("id", userData.empresa)
          .single()
          .then(({ data, error }) => {
            setEmpresa(data);
            setError(error);
            setLoading(false);
          });
      });
  }, [creatorUuid]);

  return { empresa, loading, error };
}
