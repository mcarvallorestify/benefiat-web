import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SucursalSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sucursales: Array<{ id: number; nombre?: string | null; direccion?: string | null }>;
  selectedSucursalId: number | null;
  onSelectSucursal: (sucursalId: number) => void;
  onConfirm: () => void;
  disableClose?: boolean;
}

export function SucursalSelectorModal({
  open,
  onOpenChange,
  sucursales,
  selectedSucursalId,
  onSelectSucursal,
  onConfirm,
  disableClose = false,
}: SucursalSelectorModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (disableClose && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecciona tu sucursal</DialogTitle>
          <DialogDescription>
            Elige la sucursal con la que trabajarás en esta sesión.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Select
              value={selectedSucursalId ? String(selectedSucursalId) : ""}
              onValueChange={(val) => onSelectSucursal(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {sucursales.map((suc) => (
                  <SelectItem key={suc.id} value={String(suc.id)}>
                    {suc.nombre || `Sucursal ${suc.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={onConfirm}
            disabled={!selectedSucursalId}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
