import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useProductos } from "@/hooks/useProductos";
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
import { Plus, Search, Package, Edit, Trash2, MoreHorizontal } from "lucide-react";

function formatCLP(value: number) {
  return value?.toLocaleString('es-CL');
}

export default function Productos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);
  const { productos, loading: loadingProductos } = useProductos(empresa?.id);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filteredProducts = productos.filter(
    (product) =>
      product.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const productsPage = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  // reset page when filter changes
  useEffect(() => { setPage(1); }, [searchTerm, productos.length]);

  

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
        <div className="bg-card rounded-xl border border-border overflow-x-auto animate-fade-in">
          {loadingProductos ? (
            <div className="p-8 text-center text-muted-foreground">Cargando productos...</div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-4">Producto</th>
                  <th className="text-left p-4 hidden md:table-cell">Categoría</th>
                  <th className="text-right p-4">Precio</th>
                  <th className="text-right p-4">Stock</th>
                  <th className="text-center p-4 hidden md:table-cell">Estado</th>
                  <th className="text-center p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productsPage.map((product) => (
                  <tr key={product.id} className="table-row">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.nombre}</p>
                          <p className="text-sm text-muted-foreground">{product.codigo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant="secondary">{product.categoria}</Badge>
                    </td>
                    <td className="p-4 text-right font-semibold text-foreground">
                      {formatCLP(product.precio)}
                    </td>
                    <td className="p-4 text-right">
                      {product.stock === 0 ? (
                        <span className="text-muted-foreground">0</span>
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
                    <td className="p-4 text-center hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={
                          product.activo ? "badge-success" : "badge-error"
                        }
                      >
                        {product.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      {/* Acciones: menú de 3 puntos en móvil, botones en desktop */}
                      <div className="flex items-center justify-center gap-2 md:hidden">
                        <MenuAcciones product={product} />
                      </div>
                      <div className="hidden md:flex items-center justify-center gap-2">
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
          )}
          {/* Pagination Productos */}
          {!loadingProductos && (
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">Mostrando {productsPage.length} de {filteredProducts.length} productos</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
                <div className="text-sm">{page} / {totalPages}</div>
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Siguiente</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Al final del archivo:
function MenuAcciones({ product }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
        <MoreHorizontal className="w-5 h-5" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-t-xl w-full max-w-sm mx-auto p-6 pb-4 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="justify-start gap-2" onClick={() => { setOpen(false); /* lógica editar */ }}>
                <Edit className="w-4 h-4" /> Editar
              </Button>
              <Button variant="ghost" className="justify-start gap-2 text-destructive" onClick={() => { setOpen(false); /* lógica eliminar */ }}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </Button>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
