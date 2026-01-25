import { FileText, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  type: "boleta" | "factura";
  number: string;
  client: string;
  amount: number;
  date: string;
  status: "emitida" | "pendiente" | "anulada";
}

const documents: Document[] = [
  {
    id: "1",
    type: "boleta",
    number: "B-001234",
    client: "Juan Pérez",
    amount: 45990,
    date: "25/01/2026",
    status: "emitida",
  },
  {
    id: "2",
    type: "factura",
    number: "F-000567",
    client: "Empresa ABC Ltda.",
    amount: 890000,
    date: "25/01/2026",
    status: "emitida",
  },
  {
    id: "3",
    type: "boleta",
    number: "B-001233",
    client: "María González",
    amount: 25990,
    date: "24/01/2026",
    status: "emitida",
  },
  {
    id: "4",
    type: "factura",
    number: "F-000566",
    client: "Servicios XYZ SpA",
    amount: 1250000,
    date: "24/01/2026",
    status: "pendiente",
  },
  {
    id: "5",
    type: "boleta",
    number: "B-001232",
    client: "Pedro Soto",
    amount: 15990,
    date: "23/01/2026",
    status: "emitida",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

export function RecentDocuments() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Documentos Recientes</h3>
        <p className="text-sm text-muted-foreground mt-1">Últimas boletas y facturas emitidas</p>
      </div>
      <div className="divide-y divide-border">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                doc.type === "boleta"
                  ? "bg-secondary/20 text-secondary-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              {doc.type === "boleta" ? (
                <Receipt className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{doc.number}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    doc.status === "emitida" && "badge-success",
                    doc.status === "pendiente" && "badge-warning",
                    doc.status === "anulada" && "badge-error"
                  )}
                >
                  {doc.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{doc.client}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">{formatCurrency(doc.amount)}</p>
              <p className="text-sm text-muted-foreground">{doc.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
