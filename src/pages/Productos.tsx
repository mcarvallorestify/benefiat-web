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
import { Plus, Search, Package, Edit, Trash2 } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  status: "activo" | "inactivo";
}

const products: Product[] = [
  {
    id: "1",
    code: "PROD-001",
    name: "Servicio de Consultoría",
    description: "Consultoría empresarial por hora",
    category: "Servicios",
    price: 75000,
    stock: 0,
    unit: "hora",
    status: "activo",
  },
  {
    id: "2",
    code: "PROD-002",
    name: "Laptop HP ProBook",
    description: "Laptop empresarial 14 pulgadas",
    category: "Equipos",
    price: 890000,
    stock: 15,
    unit: "unidad",
    status: "activo",
  },
  {
    id: "3",
    code: "PROD-003",
    name: "Licencia Software Anual",
    description: "Licencia de software empresarial",
    category: "Software",
    price: 250000,
    stock: 0,
    unit: "licencia",
    status: "activo",
  },
  {
    id: "4",
    code: "PROD-004",
    name: "Mouse Inalámbrico",
    description: "Mouse ergonómico inalámbrico",
    category: "Accesorios",
    price: 25990,
    stock: 45,
    unit: "unidad",
    status: "activo",
  },
  {
    id: "5",
    code: "PROD-005",
    name: "Monitor 27 pulgadas",
    description: "Monitor LED Full HD",
    category: "Equipos",
    price: 189990,
    stock: 8,
    unit: "unidad",
    status: "inactivo",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

export default function Productos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Productos</h1>
            <p className="page-subtitle mt-1">Gestiona tu catálogo de productos y servicios</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Código</Label>
                    <Input placeholder="PROD-XXX" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Categoría</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="servicios">Servicios</SelectItem>
                        <SelectItem value="equipos">Equipos</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="accesorios">Accesorios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Nombre del Producto</Label>
                  <Input placeholder="Nombre del producto o servicio" />
                </div>
                <div className="grid gap-2">
                  <Label>Descripción</Label>
                  <Input placeholder="Descripción breve" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Precio</Label>
                    <Input type="number" placeholder="$0" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Stock</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unidad</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidad">Unidad</SelectItem>
                        <SelectItem value="hora">Hora</SelectItem>
                        <SelectItem value="licencia">Licencia</SelectItem>
                        <SelectItem value="kg">Kilogramo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Guardar Producto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left p-4">Producto</th>
                <th className="text-left p-4">Categoría</th>
                <th className="text-right p-4">Precio</th>
                <th className="text-right p-4">Stock</th>
                <th className="text-center p-4">Estado</th>
                <th className="text-center p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="table-row">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary">{product.category}</Badge>
                  </td>
                  <td className="p-4 text-right font-semibold text-foreground">
                    {formatCurrency(product.price)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{product.unit}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {product.stock === 0 ? (
                      <span className="text-muted-foreground">N/A</span>
                    ) : (
                      <span
                        className={
                          product.stock < 10
                            ? "text-warning font-medium"
                            : "text-foreground"
                        }
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <Badge
                      variant="outline"
                      className={
                        product.status === "activo" ? "badge-success" : "badge-error"
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
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
