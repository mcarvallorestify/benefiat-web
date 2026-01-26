import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, FileText, Receipt, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  type: "boleta" | "factura";
  number: string;
  client: string;
  rut: string;
  amount: number;
  net: number;
  iva: number;
  date: string;
  status: "emitida" | "pendiente" | "anulada";
}

const documents: Document[] = [
  {
    id: "1",
    type: "factura",
    number: "F-000567",
    client: "Empresa ABC Ltda.",
    rut: "76.123.456-7",
    amount: 890000,
    net: 747899,
    iva: 142101,
    date: "25/01/2026",
    status: "emitida",
  },
  {
    id: "2",
    type: "boleta",
    number: "B-001234",
    client: "Juan Pérez",
    rut: "12.345.678-9",
    amount: 45990,
    net: 38647,
    iva: 7343,
    date: "25/01/2026",
    status: "emitida",
  },
  {
    id: "3",
    type: "factura",
    number: "F-000566",
    client: "Servicios XYZ SpA",
    rut: "76.987.654-3",
    amount: 1250000,
    net: 1050420,
    iva: 199580,
    date: "24/01/2026",
    status: "pendiente",
  },
  {
    id: "4",
    type: "boleta",
    number: "B-001233",
    client: "María González",
    rut: "9.876.543-2",
    amount: 25990,
    net: 21840,
    iva: 4150,
    date: "24/01/2026",
    status: "emitida",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

export default function Documentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "todos" || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-header">Documentos</h1>
            <p className="page-subtitle mt-1">Gestiona tus boletas y facturas electrónicas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Emitir Nuevo Documento</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Tipo de Documento</Label>
                  <Select defaultValue="boleta">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boleta">Boleta Electrónica</SelectItem>
                      <SelectItem value="factura">Factura Electrónica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Empresa ABC Ltda. - 76.123.456-7</SelectItem>
                      <SelectItem value="2">Juan Pérez - 12.345.678-9</SelectItem>
                      <SelectItem value="3">Servicios XYZ SpA - 76.987.654-3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Monto Neto</Label>
                    <Input type="number" placeholder="$0" />
                  </div>
                  <div className="grid gap-2">
                    <Label>IVA (19%)</Label>
                    <Input type="number" placeholder="$0" disabled />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Detalle</Label>
                  <Input placeholder="Descripción del servicio o producto" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Emitir Documento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los documentos</SelectItem>
              <SelectItem value="boleta">Solo Boletas</SelectItem>
              <SelectItem value="factura">Solo Facturas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-x-auto animate-fade-in">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="table-header">
                <th className="text-left p-4">Documento</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Fecha</th>
                <th className="text-right p-4">Neto</th>
                <th className="text-right p-4">IVA</th>
                <th className="text-right p-4">Total</th>
                <th className="text-center p-4">Estado</th>
                <th className="text-center p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="table-row">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          doc.type === "boleta"
                            ? "bg-secondary/20 text-secondary-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        {doc.type === "boleta" ? (
                          <Receipt className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{doc.number}</p>
                        <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-foreground">{doc.client}</p>
                    <p className="text-sm text-muted-foreground">{doc.rut}</p>
                  </td>
                  <td className="p-4 text-muted-foreground">{doc.date}</td>
                  <td className="p-4 text-right text-foreground">{formatCurrency(doc.net)}</td>
                  <td className="p-4 text-right text-muted-foreground">{formatCurrency(doc.iva)}</td>
                  <td className="p-4 text-right font-semibold text-foreground">
                    {formatCurrency(doc.amount)}
                  </td>
                  <td className="p-4 text-center">
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
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
