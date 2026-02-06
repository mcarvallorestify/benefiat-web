import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUserRole(userId?: string | null) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      // No ponemos loading en false aquí porque el userId puede estar undefined
      // temporalmente mientras el auth se está cargando
      return;
    }

    let mounted = true;
    setLoading(true);

    (async () => {
      let data: any = null;
      let error: any = null;

      const primary = await supabase
        .from("user")
        .select("tablaID, rol")
        .eq("tablaID", userId)
        .maybeSingle();

      data = primary.data;
      error = primary.error;

      if (!data && !error) {
        const fallback = await supabase
          .from("user")
          .select("tablaID, rol")
          .eq("id", userId)
          .maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }

      if (!mounted) return;
      if (error) {
        console.error("Error cargando rol de usuario:", error);
        setRole(null);
        setLoading(false);
        return;
      }

      let rawRole =
        (data as any)?.rol ||
        (data as any)?.role ||
        (data as any)?.tipoUsuario ||
        (data as any)?.tipo_usuario ||
        (data as any)?.perfil ||
        (data as any)?.Rol ||
        (data as any)?.ROL ||
        null;

      if (!rawRole) {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        rawRole =
          sessionUser?.user_metadata?.rol ||
          sessionUser?.user_metadata?.role ||
          sessionUser?.app_metadata?.rol ||
          sessionUser?.app_metadata?.role ||
          null;
      }

      const finalRole = rawRole ? String(rawRole).trim() : null;
      setRole(finalRole);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { role, loading };
}
