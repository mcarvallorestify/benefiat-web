import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useSucursales } from "@/hooks/useSucursales";
import { supabase } from "@/lib/supabaseClient";

interface Caja {
  id: number;
  created_at: string;
  updated_at?: string;
  empresa: number;
  sucursal: string;
  monto_inicial: number;
  monto_cierre: number | null;
}

interface MovimientoCaja {
  id: number;
  created_at: string;
  caja: number;
  retiro: number | null;
  ingreso: number | null;
  motivo: string;
}

export default function Caja() {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);
  const { sucursales } = useSucursales(empresa?.id);

  const [cajaActual, setCajaActual] = useState<Caja | null>(null);
  const [cajasDelDia, setCajasDelDia] = useState<Caja[]>([]);
  const [loadingCaja, setLoadingCaja] = useState(false);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Arqueo de caja
  const [openAbrirCaja, setOpenAbrirCaja] = useState(false);
  const [openCerrarCaja, setOpenCerrarCaja] = useState(false);
  const [openMovimiento, setOpenMovimiento] = useState(false);
  const [montoInicial, setMontoInicial] = useState("");
  const [montoCierre, setMontoCierre] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState<"ingreso" | "retiro">("ingreso");
  const [montoMovimiento, setMontoMovimiento] = useState("");
  const [motivoMovimiento, setMotivoMovimiento] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Reporte
  const [filtroFecha, setFiltroFecha] = useState<"dia" | "mes">("dia");
  const [fechaReporte, setFechaReporte] = useState(new Date().toISOString().split("T")[0]);
  const [mesReporte, setMesReporte] = useState(new Date().toISOString().slice(0, 7));
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [movimientosReporte, setMovimientosReporte] = useState<MovimientoCaja[]>([]);

  // Cargar caja actual del día
  useEffect(() => {
    if (!empresa?.id) return;
    cargarCajaActual();
    cargarCajasDelDia();
  }, [empresa?.id]);

  const cargarCajaActual = async () => {
    if (!empresa?.id) return;
    setLoadingCaja(true);
    try {
      const hoy = new Date().toISOString().split("T")[0];
      // Buscar la última caja abierta (sin cerrar) del día
      const { data, error } = await supabase
        .from("caja")
        .select("*")
        .eq("empresa", empresa.id)
        .gte("created_at", `${hoy}T00:00:00`)
        .lte("created_at", `${hoy}T23:59:59`)
        .is("monto_cierre", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setCajaActual(data);

      if (data) {
        await cargarMovimientos(data.id);
      }
    } catch (e: any) {
      console.error("Error cargando caja:", e);
      toast({ title: "Error", description: "No se pudo cargar la caja", variant: "destructive" });
    } finally {
      setLoadingCaja(false);
    }
  };

  const cargarCajasDelDia = async () => {
    if (!empresa?.id) return;
    try {
      const hoy = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("caja")
        .select("*")
        .eq("empresa", empresa.id)
        .gte("created_at", `${hoy}T00:00:00`)
        .lte("created_at", `${hoy}T23:59:59`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCajasDelDia(data || []);
    } catch (e: any) {
      console.error("Error cargando cajas del día:", e);
    }
  };

  const cargarMovimientos = async (cajaId: number) => {
    setLoadingMovimientos(true);
    try {
      const { data, error } = await supabase
        .from("movimiento_caja")
        .select("*")
        .eq("caja", cajaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMovimientos(data || []);
    } catch (e: any) {
      console.error("Error cargando movimientos:", e);
      toast({ title: "Error", description: "No se pudieron cargar los movimientos", variant: "destructive" });
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const abrirCaja = async () => {
    if (!empresa?.id) return;
    const monto = parseFloat(montoInicial);
    if (isNaN(monto) || monto < 0) {
      toast({ title: "Error", description: "Ingresa un monto inicial válido", variant: "destructive" });
      return;
    }

    setProcesando(true);
    try {
      const { data, error } = await supabase
        .from("caja")
        .insert([
          {
            empresa: empresa.id,
            sucursal: sucursales[0]?.id || null,
            monto_inicial: monto,
            monto_cierre: null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setCajaActual(data);
      toast({ title: "Caja abierta", description: "La caja se abrió correctamente" });
      setOpenAbrirCaja(false);
      setMontoInicial("");
      await cargarCajasDelDia();
    } catch (e: any) {
      console.error("Error abriendo caja:", e);
      toast({ title: "Error", description: e?.message || "No se pudo abrir la caja", variant: "destructive" });
    } finally {
      setProcesando(false);
    }
  };

  const cerrarCaja = async () => {
    if (!cajaActual) return;
    const monto = parseFloat(montoCierre);
    if (isNaN(monto) || monto < 0) {
      toast({ title: "Error", description: "Ingresa un monto de cierre válido", variant: "destructive" });
      return;
    }

    setProcesando(true);
    try {
      const { error } = await supabase
        .from("caja")
        .update({ monto_cierre: monto })
        .eq("id", cajaActual.id);

      if (error) throw error;
      const diferencia = monto - calcularSaldoActual();
      const mensaje = diferencia === 0 
        ? "La caja se cerró correctamente sin diferencia" 
        : `Caja cerrada con diferencia de $${Math.abs(diferencia).toLocaleString("es-CL")} (${diferencia > 0 ? "Sobra" : "Falta"})`;
      
      toast({ title: "Caja cerrada", description: mensaje });
      setCajaActual(null);
      setOpenCerrarCaja(false);
      setMontoCierre("");
      await cargarCajasDelDia();
    } catch (e: any) {
      console.error("Error cerrando caja:", e);
      toast({ title: "Error", description: e?.message || "No se pudo cerrar la caja", variant: "destructive" });
    } finally {
      setProcesando(false);
    }
  };

  const registrarMovimiento = async () => {
    if (!cajaActual) return;
    const monto = parseFloat(montoMovimiento);
    if (isNaN(monto) || monto <= 0) {
      toast({ title: "Error", description: "Ingresa un monto válido", variant: "destructive" });
      return;
    }
    if (!motivoMovimiento.trim()) {
      toast({ title: "Error", description: "Ingresa un motivo", variant: "destructive" });
      return;
    }

    setProcesando(true);
    try {
      const payload: any = {
        caja: cajaActual.id,
        motivo: motivoMovimiento,
      };

      if (tipoMovimiento === "ingreso") {
        payload.ingreso = monto;
        payload.retiro = null;
      } else {
        payload.retiro = monto;
        payload.ingreso = null;
      }

      const { data, error } = await supabase
        .from("movimiento_caja")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      setMovimientos([data, ...movimientos]);
      toast({ title: "Movimiento registrado", description: "El movimiento se registró correctamente" });
      setOpenMovimiento(false);
      setMontoMovimiento("");
      setMotivoMovimiento("");
    } catch (e: any) {
      console.error("Error registrando movimiento:", e);
      toast({ title: "Error", description: e?.message || "No se pudo registrar el movimiento", variant: "destructive" });
    } finally {
      setProcesando(false);
    }
  };

  const calcularTotalMovimientos = () => {
    return movimientos.reduce((acc, mov) => {
      if (mov.ingreso) return acc + mov.ingreso;
      if (mov.retiro) return acc - mov.retiro;
      return acc;
    }, 0);
  };

  const calcularSaldoActual = () => {
    if (!cajaActual) return 0;
    return cajaActual.monto_inicial + calcularTotalMovimientos();
  };

  // Reporte
  const cargarReporte = async () => {
    if (!empresa?.id) return;
    setLoadingMovimientos(true);
    try {
      let fechaInicio: string;
      let fechaFin: string;

      if (filtroFecha === "dia") {
        fechaInicio = `${fechaReporte}T00:00:00`;
        fechaFin = `${fechaReporte}T23:59:59`;
      } else {
        const year = parseInt(mesReporte.split("-")[0]);
        const month = parseInt(mesReporte.split("-")[1]);
        const ultimoDia = new Date(year, month, 0).getDate();
        fechaInicio = `${mesReporte}-01T00:00:00`;
        fechaFin = `${mesReporte}-${ultimoDia.toString().padStart(2, "0")}T23:59:59`;
      }

      const { data: cajasData, error: cajasError } = await supabase
        .from("caja")
        .select("*")
        .eq("empresa", empresa.id)
        .gte("created_at", fechaInicio)
        .lte("created_at", fechaFin)
        .order("created_at", { ascending: false });

      if (cajasError) throw cajasError;
      setCajas(cajasData || []);

      if (cajasData && cajasData.length > 0) {
        const cajaIds = cajasData.map((c) => c.id);
        const { data: movData, error: movError } = await supabase
          .from("movimiento_caja")
          .select("*")
          .in("caja", cajaIds)
          .order("created_at", { ascending: false });

        if (movError) throw movError;
        setMovimientosReporte(movData || []);
      } else {
        setMovimientosReporte([]);
      }
    } catch (e: any) {
      console.error("Error cargando reporte:", e);
      toast({ title: "Error", description: "No se pudo cargar el reporte", variant: "destructive" });
    } finally {
      setLoadingMovimientos(false);
    }
  };

  useEffect(() => {
    if (empresa?.id) {
      cargarReporte();
    }
  }, [empresa?.id, filtroFecha, fechaReporte, mesReporte]);

  const calcularTotalesReporte = () => {
    const totalIngresos = movimientosReporte.reduce((acc, mov) => acc + (mov.ingreso || 0), 0);
    const totalRetiros = movimientosReporte.reduce((acc, mov) => acc + (mov.retiro || 0), 0);
    return { totalIngresos, totalRetiros, diferencia: totalIngresos - totalRetiros };
  };

  const totalesReporte = calcularTotalesReporte();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Caja</h1>
          <p className="page-subtitle mt-1">Gestión de caja y movimientos diarios</p>
        </div>

        <Tabs defaultValue="arqueo" className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="bg-muted/50 w-full justify-start inline-flex min-w-max">
              <TabsTrigger value="arqueo" className="whitespace-nowrap">Arqueo de Caja</TabsTrigger>
              <TabsTrigger value="reporte" className="whitespace-nowrap">Reporte de Caja</TabsTrigger>
            </TabsList>
          </div>

          {/* Arqueo de Caja */}
          <TabsContent value="arqueo" className="space-y-6 animate-fade-in">
            {loadingCaja ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Cargando información de caja...
                </CardContent>
              </Card>
            ) : !cajaActual ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    No hay caja abierta
                  </CardTitle>
                  <CardDescription>
                    Abre la caja del día para comenzar a registrar movimientos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setOpenAbrirCaja(true)} className="gap-2">
                    <DollarSign className="w-4 h-4" />
                    Abrir Caja
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-primary" />
                          Caja Abierta
                        </CardTitle>
                        <CardDescription>
                          {new Date(cajaActual.created_at).toLocaleDateString("es-CL", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </CardDescription>
                      </div>
                      {cajaActual.monto_cierre === null ? (
                        <Badge variant="default">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Cerrada</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Monto Inicial</p>
                        <p className="text-2xl font-bold">
                          ${cajaActual.monto_inicial.toLocaleString("es-CL")}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Movimientos</p>
                        <p className="text-2xl font-bold">
                          ${calcularTotalMovimientos().toLocaleString("es-CL")}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg bg-primary/5">
                        <p className="text-sm text-muted-foreground mb-1">Saldo Actual</p>
                        <p className="text-2xl font-bold text-primary">
                          ${calcularSaldoActual().toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>

                    {cajaActual.monto_cierre !== null && (
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground mb-1">Monto de Cierre</p>
                        <p className="text-2xl font-bold">
                          ${cajaActual.monto_cierre.toLocaleString("es-CL")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Diferencia: $
                          {(cajaActual.monto_cierre - calcularSaldoActual()).toLocaleString("es-CL")}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {cajaActual.monto_cierre === null && (
                        <>
                          <Button onClick={() => setOpenMovimiento(true)} variant="outline" className="gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Registrar Movimiento
                          </Button>
                          <Button onClick={() => setOpenCerrarCaja(true)} variant="destructive" className="gap-2">
                            <Wallet className="w-4 h-4" />
                            Cerrar Caja
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Movimientos del Día</CardTitle>
                    <CardDescription>Historial de ingresos y retiros de la caja</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMovimientos ? (
                      <div className="text-center py-8 text-muted-foreground">Cargando movimientos...</div>
                    ) : movimientos.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No hay movimientos registrados</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {movimientos.map((mov) => (
                          <div
                            key={mov.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {mov.ingreso ? (
                                <div className="p-2 rounded-full bg-green-500/10">
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="p-2 rounded-full bg-red-500/10">
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{mov.motivo}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(mov.created_at).toLocaleString("es-CL")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-lg font-bold ${
                                  mov.ingreso ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {mov.ingreso ? "+" : "-"}$
                                {(mov.ingreso || mov.retiro || 0).toLocaleString("es-CL")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Reporte de Caja */}
          <TabsContent value="reporte" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Filtros de Reporte
                </CardTitle>
                <CardDescription>Selecciona el período a consultar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Filtro</Label>
                    <Select value={filtroFecha} onValueChange={(v: any) => setFiltroFecha(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dia">Por Día</SelectItem>
                        <SelectItem value="mes">Por Mes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filtroFecha === "dia" && (
                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={fechaReporte}
                        onChange={(e) => setFechaReporte(e.target.value)}
                      />
                    </div>
                  )}

                  {filtroFecha === "mes" && (
                    <div className="space-y-2">
                      <Label>Mes</Label>
                      <Input
                        type="month"
                        value={mesReporte}
                        onChange={(e) => setMesReporte(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Total Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalesReporte.totalIngresos.toLocaleString("es-CL")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    Total Retiros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    ${totalesReporte.totalRetiros.toLocaleString("es-CL")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Diferencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${totalesReporte.diferencia >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${totalesReporte.diferencia.toLocaleString("es-CL")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de cajas del día */}
            {filtroFecha === "dia" && cajasDelDia.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Cajas del Día</CardTitle>
                  <CardDescription>
                    {cajasDelDia.length} {cajasDelDia.length === 1 ? "apertura" : "aperturas"} de caja
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cajasDelDia.map((caja, index) => {
                      const createdAt = new Date(caja.created_at);
                      const closedAt = caja.monto_cierre !== null && caja.updated_at ? new Date(caja.updated_at) : null;
                      const estado = caja.monto_cierre !== null ? "Cerrada" : "Abierta";
                      const diferencia = caja.monto_cierre !== null 
                        ? caja.monto_cierre - caja.monto_inicial 
                        : null;

                      return (
                        <div key={caja.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Caja #{index + 1}</h4>
                            <span className={`px-2 py-1 rounded text-xs ${estado === "Abierta" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {estado}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Apertura</p>
                              <p className="font-medium">{createdAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                            {closedAt && (
                              <div>
                                <p className="text-muted-foreground">Cierre</p>
                                <p className="font-medium">{closedAt.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Monto Inicial</p>
                              <p className="font-medium">${caja.monto_inicial?.toLocaleString("es-CL") || 0}</p>
                            </div>
                            {caja.monto_cierre !== null && (
                              <>
                                <div>
                                  <p className="text-muted-foreground">Monto Cierre</p>
                                  <p className="font-medium">${caja.monto_cierre?.toLocaleString("es-CL") || 0}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Diferencia</p>
                                  <p className={`font-medium ${diferencia! >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    ${Math.abs(diferencia!).toLocaleString("es-CL")} {diferencia! >= 0 ? "(Sobra)" : "(Falta)"}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Detalle de Movimientos</CardTitle>
                <CardDescription>
                  {cajas.length} {cajas.length === 1 ? "caja encontrada" : "cajas encontradas"} - {movimientosReporte.length} movimientos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMovimientos ? (
                  <div className="text-center py-8 text-muted-foreground">Cargando reporte...</div>
                ) : movimientosReporte.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay movimientos en el período seleccionado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {movimientosReporte.map((mov) => (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {mov.ingreso ? (
                            <div className="p-2 rounded-full bg-green-500/10">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-full bg-red-500/10">
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{mov.motivo}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(mov.created_at).toLocaleString("es-CL")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              mov.ingreso ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {mov.ingreso ? "+" : "-"}$
                            {(mov.ingreso || mov.retiro || 0).toLocaleString("es-CL")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modales */}
        <Dialog open={openAbrirCaja} onOpenChange={setOpenAbrirCaja}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caja</DialogTitle>
              <DialogDescription>Ingresa el monto inicial de efectivo con el que abres la caja</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Monto Inicial</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAbrirCaja(false)} disabled={procesando}>
                Cancelar
              </Button>
              <Button onClick={abrirCaja} disabled={procesando}>
                {procesando ? "Abriendo..." : "Abrir Caja"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openCerrarCaja} onOpenChange={setOpenCerrarCaja}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cerrar Caja</DialogTitle>
              <DialogDescription>Ingresa el monto final contado en efectivo para cerrar la caja</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground mb-1">Saldo Esperado</p>
                <p className="text-2xl font-bold">${calcularSaldoActual().toLocaleString("es-CL")}</p>
              </div>
              <div className="grid gap-2">
                <Label>Monto de Cierre (efectivo contado)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                />
              </div>
              {montoCierre && parseFloat(montoCierre) !== calcularSaldoActual() && (
                <div className="p-3 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Diferencia: ${(parseFloat(montoCierre) - calcularSaldoActual()).toLocaleString("es-CL")}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCerrarCaja(false)} disabled={procesando}>
                Cancelar
              </Button>
              <Button onClick={cerrarCaja} disabled={procesando} variant="destructive">
                {procesando ? "Cerrando..." : "Cerrar Caja"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openMovimiento} onOpenChange={setOpenMovimiento}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Movimiento</DialogTitle>
              <DialogDescription>Registra un ingreso o retiro de efectivo de la caja</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Tipo de Movimiento</Label>
                <Select value={tipoMovimiento} onValueChange={(v: any) => setTipoMovimiento(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="retiro">Retiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={montoMovimiento}
                  onChange={(e) => setMontoMovimiento(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Motivo</Label>
                <Textarea
                  placeholder="Describe el motivo del movimiento..."
                  value={motivoMovimiento}
                  onChange={(e) => setMotivoMovimiento(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenMovimiento(false)} disabled={procesando}>
                Cancelar
              </Button>
              <Button onClick={registrarMovimiento} disabled={procesando}>
                {procesando ? "Guardando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
