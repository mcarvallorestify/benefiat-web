import React, { useEffect, useState } from "react";
import { FileText, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";

type DocRow = {
  id: string;
  tipoDocumento: number;
  usuario?: string; // tablaID
  monto?: number;
  created_at?: string;
  url?: string;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(amount || 0));
};

export function RecentDocuments() {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, { nombre?: string; apellido?: string }>>({});

  useEffect(() => {
    let mounted = true;
    if (!empresa?.id) {
      setDocs([]);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("documentosEmitidos")
          .select("id, tipoDocumento, usuario, monto, created_at, url")
          .eq("empresa", empresa.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) {
          console.error("Error cargando documentosEmitidos:", error);
          if (!mounted) return;
          setDocs([]);
          return;
        }
        const rows: DocRow[] = (data as any[]) || [];
        if (!mounted) return;
        setDocs(rows);

        // obtener usuarios relacionados
        const usuarioIds = Array.from(new Set(rows.map((r) => r.usuario).filter(Boolean)));
        if (usuarioIds.length > 0) {
          const { data: usersData } = await supabase
            .from("user")
            .select("tablaID, nombre, apellido")
            .in("tablaID", usuarioIds as any[]);
          const map: Record<string, { nombre?: string; apellido?: string }> = {};
          (usersData || []).forEach((u: any) => {
            map[String(u.tablaID)] = { nombre: u.nombre, apellido: u.apellido };
          });
          if (!mounted) return;
          setUsersMap(map);
        }
      } catch (e) {
        console.error("Error fetching recent documentos:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [empresa?.id]);

  const openPdf = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Documentos Recientes</h3>
        <p className="text-sm text-muted-foreground mt-1">Últimas boletas y facturas emitidas</p>
      </div>
      <div className="divide-y divide-border">
        {docs.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No hay documentos</div>
        ) : (
          docs.map((doc) => {
            const isBoleta = Number(doc.tipoDocumento) === 39;
            const userInfo = doc.usuario ? usersMap[String(doc.usuario)] : null;
            const clientName = userInfo ? `${userInfo.nombre || ''} ${userInfo.apellido || ''}`.trim() : (doc.usuario || 'Cliente');
            const dateStr =  doc.created_at || '';
            return (
              <div
                key={doc.id}
                className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4 cursor-pointer"
                onClick={() => openPdf(doc.url)}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isBoleta ? "bg-secondary/20 text-secondary-foreground" : "bg-primary/10 text-primary"
                  )}
                >
                  {isBoleta ? <Receipt className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const t = Number(doc.tipoDocumento);
                      const label = t === 33 ? 'Factura electrónica' : t === 39 ? 'Boleta electrónica' : 'Documento';
                      return <span className="font-medium text-foreground">{label}</span>;
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{clientName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{formatCurrency(Number(doc.monto || 0))}</p>
                  <p className="text-sm text-muted-foreground">{dateStr ? new Date(dateStr).toLocaleDateString() : ''}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
