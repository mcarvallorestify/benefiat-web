import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardList, Edit, MoreHorizontal, Trash2 } from "lucide-react";

interface MenuAccionesProps {
  product: any;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
}

export function MenuAcciones({ product, onEdit, onDelete }: MenuAccionesProps) {
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
              <Button variant="ghost" className="justify-start gap-2" onClick={() => { setOpen(false); onEdit(product); }}>
                <Edit className="w-4 h-4" /> Editar
              </Button>
              <Button variant="ghost" className="justify-start gap-2 text-destructive" onClick={() => { setOpen(false); onDelete(product); }}>
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

interface MenuAccionesInventarioProps {
  product: any;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onIngreso: (product: any) => void;
}

export function MenuAccionesInventario({
  product,
  onEdit,
  onDelete,
  onIngreso,
}: MenuAccionesInventarioProps) {
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
              <Button variant="ghost" className="justify-start gap-2" onClick={() => { setOpen(false); onEdit(product); }}>
                <Edit className="w-4 h-4" /> Editar
              </Button>
              <Button variant="ghost" className="justify-start gap-2" onClick={() => { setOpen(false); onIngreso(product); }}>
                <ClipboardList className="w-4 h-4" /> Ingreso
              </Button>
              <Button variant="ghost" className="justify-start gap-2 text-destructive" onClick={() => { setOpen(false); onDelete(product); }}>
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

interface IngresoInventarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: any | null;
  cantidad: string;
  precioCompra: string;
  loading: boolean;
  onCantidadChange: (value: string) => void;
  onPrecioCompraChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function IngresoInventarioDialog({
  open,
  onOpenChange,
  producto,
  cantidad,
  precioCompra,
  loading,
  onCantidadChange,
  onPrecioCompraChange,
  onSave,
  onCancel,
}: IngresoInventarioDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ingreso de Inventario</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Producto</Label>
            <Input value={producto?.nombre || ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Cantidad</Label>
            <Input
              type="text"
              value={cantidad}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                onCantidadChange(val);
              }}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key) && e.key !== "Enter") e.preventDefault();
                if (e.key === "Enter") onSave();
              }}
              placeholder="0"
              inputMode="numeric"
            />
          </div>
          <div className="grid gap-2">
            <Label>Precio Compra</Label>
            <Input
              type="text"
              value={precioCompra}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                if (val === "" || !isNaN(parseFloat(val))) {
                  onPrecioCompraChange(val);
                }
              }}
              onKeyPress={(e) => {
                if (!/[0-9.]/.test(e.key) && e.key !== "Enter") e.preventDefault();
                if (e.key === "Enter") onSave();
              }}
              placeholder="$0"
              inputMode="decimal"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={loading || !cantidad}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
