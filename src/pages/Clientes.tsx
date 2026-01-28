import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useClientes } from "@/hooks/useClientes";
import { supabase } from "@/lib/supabaseClient";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";




// Si necesitas formatear montos, puedes dejar esta función:
const formatCurrency = (amount: number) => {
  if (!amount) return "$0";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Validación de RUT (DV) adaptada desde la versión Dart/Flutter proporcionada
function _calcularDigitoVerificador(numero: string): string {
  let suma = 0;
  let multiplicador = 2;
  for (let i = numero.length - 1; i >= 0; i--) {
    const digito = parseInt(numero[i], 10);
    suma += digito * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = suma % 11;
  let dv = String(11 - resto);
  if (dv === '11') return '0';
  if (dv === '10') return 'K';
  return dv;
}

function validarRut(run: string | number, dv: string): boolean {
  try {
    const runStr = String(run).replace(/[^0-9]/g, '');
    const dvNormalizado = String(dv).toUpperCase();
    if (!/^[0-9K]$/.test(dvNormalizado)) return false;
    if (runStr.length < 7 || runStr.length > 8) return false;
    const dvCalculado = _calcularDigitoVerificador(runStr);
    return dvNormalizado === dvCalculado;
  } catch (e) {
    return false;
  }
}

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();
  // Igual que en Productos: useEmpresa(user?.id)
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);
  const { clientes, loading: loadingClientes } = useClientes(empresa?.id);

  // Estado local para soportar resultados del servidor (búsqueda por nombre+apellido)
  const [clientesLocal, setClientesLocal] = useState([]);
  const [loadingClientesSearch, setLoadingClientesSearch] = useState(false);
  const [errorClientesSearch, setErrorClientesSearch] = useState("");

  // Form state for creating cliente
  const [formNombre, setFormNombre] = useState("");
  const [formApellido, setFormApellido] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNumeroContacto, setFormNumeroContacto] = useState("");
  const [formDireccion, setFormDireccion] = useState("");
  const [formRun, setFormRun] = useState("");
  const [formDv, setFormDv] = useState("");
  const [isEmpresa, setIsEmpresa] = useState(false);
  const [formRazSocial, setFormRazSocial] = useState("");
  const [formGiro, setFormGiro] = useState("");
  const [formRegion, setFormRegion] = useState<number | null>(null);
  const [formCiudad, setFormCiudad] = useState<number | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [creatingCliente, setCreatingCliente] = useState(false);
  const [createError, setCreateError] = useState("");

  // Load regions on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("region").select("*");
        if (mounted) setRegions((data as any[]) || []);
      } catch (e) {
        console.warn("No se pudo cargar regiones", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load ciudades when region changes
  useEffect(() => {
    if (!formRegion) { setCiudades([]); return; }
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("ciudad").select("*").eq("region", formRegion);
        if (mounted) setCiudades((data as any[]) || []);
      } catch (e) {
        console.warn("No se pudo cargar ciudades", e);
      }
    })();
    return () => { mounted = false; };
  }, [formRegion]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;
  useEffect(() => { setPage(1); }, [clientesLocal.length]);

  // Mantener lista completa si no hay búsqueda
  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === "") {
      setClientesLocal(clientes || []);
    }
  }, [clientes, searchTerm]);

  // Buscar en la BD por nombre + apellido cuando el usuario escribe
  useEffect(() => {
    if (!empresa?.id) return;
    const q = searchTerm?.trim();
    if (!q) {
      setErrorClientesSearch("");
      setLoadingClientesSearch(false);
      setClientesLocal(clientes || []);
      return;
    }
    setLoadingClientesSearch(true);
    setErrorClientesSearch("");
    const parts = q.split(/\s+/).filter(Boolean);
    const selectCols = 'tablaID, nombre, apellido, email, direccion';
    if (parts.length >= 2) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      supabase
        .from('user')
        .select(selectCols)
        .eq('empresa', empresa.id)
        .ilike('nombre', `%${first}%`)
        .ilike('apellido', `%${last}%`)
        .then(({ data, error }) => {
          setLoadingClientesSearch(false);
          if (error) {
            console.error('Error Supabase clientes:', error);
            setErrorClientesSearch(error.message || 'Error desconocido');
            setClientesLocal([]);
          } else {
            setClientesLocal(data || []);
          }
        });
    } else {
      const term = parts[0];
      supabase
        .from('user')
        .select(selectCols)
        .eq('empresa', empresa.id)
        .or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%`)
        .then(({ data, error }) => {
          setLoadingClientesSearch(false);
          if (error) {
            console.error('Error Supabase clientes:', error);
            setErrorClientesSearch(error.message || 'Error desconocido');
            setClientesLocal([]);
          } else {
            setClientesLocal(data || []);
          }
        });
    }
  }, [searchTerm, empresa?.id]);

  // Mostrar la lista resultante (servidor o completa)
  const filteredClients = Array.isArray(clientesLocal) ? clientesLocal : [];
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const clientsPage = filteredClients.slice((page - 1) * pageSize, page * pageSize);

  // City search for ciudad select
  const [citySearch, setCitySearch] = useState("");
  const filteredCiudades = ciudades.filter((c) => {
    if (!citySearch) return true;
    return (c.nombre || "").toString().toLowerCase().includes(citySearch.toLowerCase());
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Nombre</Label>
                    <Input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Nombre" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Apellido</Label>
                    <Input value={formApellido} onChange={(e) => setFormApellido(e.target.value)} placeholder="Apellido" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>RUN (8 dígitos)</Label>
                    <Input value={formRun} onChange={(e) => setFormRun(e.target.value.replace(/[^0-9]/g, ""))} maxLength={8} placeholder="12345678" />
                  </div>
                  <div className="grid gap-2">
                    <Label>DV</Label>
                    <Input value={formDv} onChange={(e) => setFormDv(e.target.value.slice(0,1))} maxLength={1} placeholder="K o número" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Teléfono</Label>
                    <Input value={formNumeroContacto} onChange={(e) => setFormNumeroContacto(e.target.value)} placeholder="+56 9 1234 5678" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@ejemplo.com" />
                </div>

                <div className="grid gap-2">
                  <Label>Dirección</Label>
                  <Input value={formDireccion} onChange={(e) => setFormDireccion(e.target.value)} placeholder="Dirección completa" />
                </div>

                <div className="flex items-center gap-3">
                  <input id="isEmpresa" type="checkbox" checked={isEmpresa} onChange={(e) => setIsEmpresa(e.target.checked)} />
                  <label htmlFor="isEmpresa" className="text-sm">Es empresa (agregar Razón Social y Giro)</label>
                </div>

                {isEmpresa && (
                  <>
                    <div className="grid gap-2">
                      <Label>Razón Social</Label>
                      <Input value={formRazSocial} onChange={(e) => setFormRazSocial(e.target.value)} placeholder="Razón social" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Giro</Label>
                      <Input value={formGiro} onChange={(e) => setFormGiro(e.target.value)} placeholder="Giro" />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Región</Label>
                      <Select value={formRegion ? String(formRegion) : ""} onValueChange={(v) => { setFormRegion(v ? Number(v) : null); setFormCiudad(null); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar región" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                  <div>
                    <Label>Ciudad</Label>
                    <Select value={formCiudad ? String(formCiudad) : ""} onValueChange={(v) => setFormCiudad(v ? Number(v) : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input placeholder="Buscar ciudad..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} />
                        </div>
                        <div className="max-h-56 overflow-auto">
                          {filteredCiudades.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {createError && <div className="text-sm text-destructive">{createError}</div>}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={creatingCliente}>
                  Cancelar
                </Button>
                <Button onClick={async () => {
                  setCreateError("");
                  // basic validation
                  if (!formNombre || (!formApellido && !isEmpresa)) { setCreateError('Nombre y apellido son requeridos'); return; }
                  if (!formEmail) { setCreateError('Email es requerido'); return; }
                  if (!validarRut(formRun, formDv)) { setCreateError('RUN/DV inválido'); return; }
                  setCreatingCliente(true);
                  try {
                    const insertObj: any = {
                      nombre: formNombre,
                      apellido: formApellido || null,
                      email: formEmail,
                      numeroContacto: formNumeroContacto || null,
                      direccion: formDireccion || null,
                      run: Number(String(formRun).replace(/\D/g, '')),
                      dv: String(formDv),
                      empresa: empresa?.id || null,
                      estado: 'activo',
                      pais: 'Chile',
                      region: formRegion || null,
                      ciudad: formCiudad || null,
                    };
                    if (isEmpresa) {
                      insertObj.raz_social = formRazSocial || null;
                      insertObj.giro = formGiro || null;
                    }

                    const { data, error } = await supabase.from('user').insert([insertObj]);
                    if (error) {
                      console.error('Error creando cliente', error);
                      setCreateError(error.message || 'Error creando cliente');
                      setCreatingCliente(false);
                      return;
                    }
                    // reload clientes list from server to keep consistent
                    const { data: refreshed } = await supabase.from('user').select('tablaID, nombre, apellido, email').eq('empresa', empresa?.id).order('created_at', { ascending: false });
                    setClientesLocal((refreshed as any[]) || []);
                    // reset form
                    setFormNombre(''); setFormApellido(''); setFormEmail(''); setFormNumeroContacto(''); setFormDireccion(''); setFormRun(''); setFormDv(''); setIsEmpresa(false); setFormRazSocial(''); setFormGiro(''); setFormRegion(null); setFormCiudad(null);
                    setIsDialogOpen(false);
                  } catch (e: any) {
                    console.error(e);
                    setCreateError(e?.message || 'Error desconocido');
                  } finally {
                    setCreatingCliente(false);
                  }
                }} disabled={creatingCliente}>
                  {creatingCliente ? 'Guardando...' : 'Guardar Cliente'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o RUN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={loadingEmpresa || loadingClientesSearch}
            />
          </div>
          <Button onClick={() => { setSearchTerm(''); setClientesLocal(clientes || []); }}>
            Buscar
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(loadingEmpresa || loadingClientes) ? (
            <div className="col-span-full text-center text-muted-foreground">Cargando clientes...</div>
          ) : filteredClients.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground">No hay clientes</div>
          ) : (
            clientsPage.map((client) => (
              <div
                key={client.tablaID}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-card-hover transition-shadow animate-fade-in"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{client.nombre} {client.apellido}</h3>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
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
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Clientes */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">Mostrando {clientsPage.length} de {filteredClients.length} clientes</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
            <div className="text-sm">{page} / {totalPages}</div>
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Siguiente</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
