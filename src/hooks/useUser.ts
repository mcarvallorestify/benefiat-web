import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const session = data?.session ?? null;

      if (session) {
        const startedAt = Number(localStorage.getItem("session_started_at") || 0);
        const now = Date.now();
        if (startedAt && now - startedAt > SESSION_TTL_MS) {
          await supabase.auth.signOut();
          localStorage.removeItem("session_started_at");
          sessionStorage.removeItem("sucursal_modal_pending");
          setUser(null);
          setLoading(false);
          return;
        }
        if (!startedAt) {
          localStorage.setItem("session_started_at", String(now));
        }
        setUser(session.user ?? null);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (!localStorage.getItem("session_started_at")) {
          localStorage.setItem("session_started_at", String(Date.now()));
        }
        setUser(session.user ?? null);
      } else {
        localStorage.removeItem("session_started_at");
        sessionStorage.removeItem("sucursal_modal_pending");
        setUser(null);
      }
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
