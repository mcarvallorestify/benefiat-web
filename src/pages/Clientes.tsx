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
import { Label } from "@/components/ui/label";
import { Plus, Search, MoreHorizontal, Mail, Phone, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
  id: string;
  name: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  type: "persona" | "empresa";
  totalPurchases: number;
  lastPurchase: string;
}

const clients: Client[] = [
  {
    id: "1",
    name: "Empresa ABC Ltda.",
    rut: "76.123.456-7",
    email: "contacto@empresaabc.cl",
    phone: "+56 9 1234 5678",
    address: "Av. Providencia 1234, Santiago",
    type: "empresa",
    totalPurchases: 4560000,
    lastPurchase: "25/01/2026",
  },
  {
    id: "2",
    name: "Juan Pérez",
    rut: "12.345.678-9",
    email: "juan.perez@email.com",
    phone: "+56 9 8765 4321",
    address: "Los Leones 567, Providencia",
    type: "persona",
    totalPurchases: 245990,
    lastPurchase: "24/01/2026",
  },
  {
    id: "3",
    name: "Servicios XYZ SpA",
    rut: "76.987.654-3",
    email: "ventas@xyz.cl",
    phone: "+56 2 2345 6789",
    address: "El Bosque Norte 890, Las Condes",
    type: "empresa",
    totalPurchases: 8900000,
    lastPurchase: "23/01/2026",
  },
  {
    id: "4",
    name: "María González",
    rut: "9.876.543-2",
    email: "maria.gonzalez@email.com",
    phone: "+56 9 5555 1234",
    address: "Av. Apoquindo 4500, Las Condes",
    type: "persona",
    totalPurchases: 89990,
    lastPurchase: "22/01/2026",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.rut.includes(searchTerm)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Clientes</h1>
            <p className="page-subtitle mt-1">Gestiona tu cartera de clientes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>RUT</Label>
                  <Input placeholder="12.345.678-9" />
                </div>
                <div className="grid gap-2">
                  <Label>Nombre / Razón Social</Label>
                  <Input placeholder="Nombre del cliente o empresa" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@ejemplo.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Teléfono</Label>
                    <Input placeholder="+56 9 1234 5678" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Dirección</Label>
                  <Input placeholder="Dirección completa" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Guardar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-card-hover transition-shadow animate-fade-in"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.rut}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Ver documentos</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total compras</p>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(client.totalPurchases)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    client.type === "empresa"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary/20 text-secondary-foreground border-secondary/30"
                  }
                >
                  {client.type === "empresa" ? "Empresa" : "Persona"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
