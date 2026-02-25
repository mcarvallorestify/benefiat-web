import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useUser } from "@/hooks/useUser";

export interface Proyecto {
  id: string;
  created_at: string;
  empresa: number | null;
  nombre: string | null;
  descripcion: string | null;
  cliente: string | null;
  ubicacion: string | null;
  galeria: string[] | null;
}

export function useProyectos() {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProyectos = async () => {
    if (!empresa?.id || (empresa.id !== 104 && empresa.id !== 78)) {
      setProyectos([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("proyectos")
      .select("*")
      .eq("empresa", empresa.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      setError(error.message);
      setProyectos([]);
    } else {
      setError(null);
      setProyectos(data || []);
    }
  };

  useEffect(() => {
    fetchProyectos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id]);

  return { proyectos, loading, error, refetch: fetchProyectos };
}
