import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Filter, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Orden {
  id: string;
  created_at: string;
  monto: number;
  cantidad: number;
  estado: string;
  usuario: string;
  nombre: string | null;
  apellido: string | null;
  tipoVenta: string | null;
}

interface OrdenItem {
  id: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  nombreProducto: string | null;
  product_id: string | null;
  orden_id: string | null;
  valorCompraProducto?: number | null;
}

interface Producto {
  id: string;
  nombre: string;
  categoria: number | null;
  proveedor: number | null;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Proveedor {
  id: number;
  razonsocial: string;
}

interface ReporteAgrupado {
  nombre: string;
  cantidadOrdenes: number;
  cantidadProductos: number;
  totalVentas: number;
  detalles?: string;
  totalCostos?: number;
  porcentajeGanancia?: number;
}

const formatCLP = (value: number) => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    maximumFractionDigits: 0 
  }).format(Math.round(value));
};

export default function ReporteMensual() {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [proveedorSearchReporte, setProveedorSearchReporte] = useState("");
  const [tipoAgrupacion, setTipoAgrupacion] = useState<"orden" | "producto" | "proveedor" | "categoria">("orden");
  const [filtroMedioPago, setFiltroMedioPago] = useState("");

  // Datos
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [ordenItems, setOrdenItems] = useState<OrdenItem[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);

  // Totales
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    if (!empresa?.id) return;
    cargarDatos();
  }, [empresa?.id, fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    if (!empresa?.id) return;
    setLoading(true);
    try {
      // Cargar órdenes del período
      const { data: ordenesData, error: ordenesError } = await supabase
        .from('Orden')
        .select('*')
        .eq('empresa', empresa.id)
        .gte('created_at', `${fechaInicio}T00:00:00`)
        .lte('created_at', `${fechaFin}T23:59:59`)
        .order('created_at', { ascending: false });

      if (ordenesError) {
        console.error('Error cargando órdenes:', ordenesError);
        setOrdenes([]);
      } else {
        // Asegura que todas las órdenes tengan la propiedad mediodePago
        const ordenesConMedio = (ordenesData || []).map(o => ({
          ...o,
          mediodePago: typeof o.mediodePago === 'undefined' ? '' : o.mediodePago
        }));
        setOrdenes(ordenesConMedio);
      }

      // Cargar orden_items de esas órdenes
      if (ordenesData && ordenesData.length > 0) {
        const ordenIds = ordenesData.map(o => o.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('orden_items')
          .select('*')
          .in('orden_id', ordenIds);

        if (itemsError) {
          console.error('Error cargando orden_items:', itemsError);
          setOrdenItems([]);
        } else {
          setOrdenItems(itemsData || []);
        }
      } else {
        setOrdenItems([]);
      }

      // Cargar productos
      const { data: productosData, error: productosError } = await supabase
        .from('Producto')
        .select('*')
        .eq('empresa', empresa.id);

      if (!productosError) {
        setProductos(productosData || []);
      }

      // Cargar categorías
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias')
        .select('*')
        .eq('empresa', empresa.id);

      if (!categoriasError) {
        setCategorias(categoriasData || []);
      }

      // Cargar proveedores
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from('proveedores')
        .select('*')
        .eq('empresa', empresa.id);

      if (!proveedoresError) {
        setProveedores(proveedoresData || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y calcular datos
  const datosFiltrados = React.useMemo(() => {

    let ordenesFiltradas = [...ordenes];

    // Filtro por cliente
    if (filtroCliente) {
      ordenesFiltradas = ordenesFiltradas.filter(o => {
        const nombreCompleto = `${o.nombre || ''} ${o.apellido || ''}`.toLowerCase();
        return nombreCompleto.includes(filtroCliente.toLowerCase());
      });
    }

    // Filtro por producto
    if (filtroProducto) {
      const ordenIdsConProducto = ordenItems
        .filter(item => item.nombreProducto?.toLowerCase().includes(filtroProducto.toLowerCase()))
        .map(item => item.orden_id);
      ordenesFiltradas = ordenesFiltradas.filter(o => ordenIdsConProducto.includes(o.id));
    }

    // Filtro por proveedor
    if (filtroProveedor) {
      const proveedor = proveedores.find(p => p.razonsocial.toLowerCase().includes(filtroProveedor.toLowerCase()));
      if (proveedor) {
        const productosDelProveedor = productos.filter(p => p.proveedor === proveedor.id);
        const productosIds = productosDelProveedor.map(p => p.id);
        const ordenIdsConProveedor = ordenItems
          .filter(item => item.product_id && productosIds.includes(item.product_id))
          .map(item => item.orden_id);
        ordenesFiltradas = ordenesFiltradas.filter(o => ordenIdsConProveedor.includes(o.id));
      }
    }

    // Filtro por medio de pago (exacto, case-insensitive)
    if (filtroMedioPago) {
      ordenesFiltradas = ordenesFiltradas.filter(o => {
        const medio = (o as any).mediodePago || "";
        return medio.toLowerCase() === filtroMedioPago.toLowerCase();
      });
    }

    // Calcular totales
    const total = ordenesFiltradas.reduce((sum, o) => sum + Number(o.monto || 0), 0);
    const itemsFiltrados = ordenItems.filter(item => 
      ordenesFiltradas.some(o => o.id === item.orden_id)
    );
    const totalProds = itemsFiltrados.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

    setTotalVentas(total);
    setTotalOrdenes(ordenesFiltradas.length);
    setTotalProductos(totalProds);

    return { ordenesFiltradas, itemsFiltrados };
  }, [ordenes, ordenItems, filtroCliente, filtroProducto, filtroProveedor, productos, proveedores]);

  // Agrupar datos según el tipo seleccionado
  const datosAgrupados = React.useMemo((): ReporteAgrupado[] => {
    const { ordenesFiltradas, itemsFiltrados } = datosFiltrados;

    const calcularPorcentajeGanancia = (totalVentas: number, totalCostos: number): number => {
      if (totalCostos === 0) return 0;
      return ((totalVentas - totalCostos) / totalCostos) * 100;
    };

    if (tipoAgrupacion === "orden") {
      return ordenesFiltradas.map(orden => {
        const itemsDelOrden = ordenItems.filter(i => i.orden_id === orden.id);
        const totalCostos = itemsDelOrden.reduce((s, i) => {
          const costoPorItem = (i.valorCompraProducto || 0) * Number(i.cantidad || 0);
          return s + costoPorItem;
        }, 0);
        const porcentajeGanancia = calcularPorcentajeGanancia(Number(orden.monto || 0), totalCostos);

        return {
          nombre: `Orden #${orden.id.substring(0, 8)} - ${orden.nombre || 'Sin nombre'} ${orden.apellido || ''}`,
          cantidadOrdenes: 1,
          cantidadProductos: itemsDelOrden.reduce((s, i) => s + Number(i.cantidad || 0), 0),
          totalVentas: Number(orden.monto || 0),
          totalCostos,
          porcentajeGanancia,
          detalles: new Date(orden.created_at).toLocaleDateString('es-CL')
        };
      });
    }

    if (tipoAgrupacion === "producto") {
      const agrupado = new Map<string, ReporteAgrupado>();
      
      itemsFiltrados.forEach(item => {
        const nombreProd = item.nombreProducto || 'Sin nombre';
        if (!agrupado.has(nombreProd)) {
          agrupado.set(nombreProd, {
            nombre: nombreProd,
            cantidadOrdenes: 0,
            cantidadProductos: 0,
            totalVentas: 0,
            totalCostos: 0,
            porcentajeGanancia: 0
          });
        }
        const grupo = agrupado.get(nombreProd)!;
        grupo.cantidadOrdenes += 1;
        grupo.cantidadProductos += Number(item.cantidad || 0);
        grupo.totalVentas += Number(item.subtotal || 0);
        grupo.totalCostos = (grupo.totalCostos || 0) + ((item.valorCompraProducto || 0) * Number(item.cantidad || 0));
        grupo.porcentajeGanancia = calcularPorcentajeGanancia(grupo.totalVentas, grupo.totalCostos!);
      });

      return Array.from(agrupado.values()).sort((a, b) => b.totalVentas - a.totalVentas);
    }

    if (tipoAgrupacion === "proveedor") {
      const agrupado = new Map<number, ReporteAgrupado>();

      itemsFiltrados.forEach(item => {
        if (!item.product_id) return;
        const producto = productos.find(p => p.id === item.product_id);
        if (!producto || !producto.proveedor) return;
        
        const proveedor = proveedores.find(p => p.id === producto.proveedor);
        if (!proveedor) return;

        if (!agrupado.has(proveedor.id)) {
          agrupado.set(proveedor.id, {
            nombre: proveedor.razonsocial,
            cantidadOrdenes: 0,
            cantidadProductos: 0,
            totalVentas: 0,
            totalCostos: 0,
            porcentajeGanancia: 0
          });
        }
        const grupo = agrupado.get(proveedor.id)!;
        grupo.cantidadOrdenes += 1;
        grupo.cantidadProductos += Number(item.cantidad || 0);
        grupo.totalVentas += Number(item.subtotal || 0);
        grupo.totalCostos = (grupo.totalCostos || 0) + ((item.valorCompraProducto || 0) * Number(item.cantidad || 0));
        grupo.porcentajeGanancia = calcularPorcentajeGanancia(grupo.totalVentas, grupo.totalCostos!);
      });

      return Array.from(agrupado.values()).sort((a, b) => b.totalVentas - a.totalVentas);
    }

    if (tipoAgrupacion === "categoria") {
      const agrupado = new Map<number, ReporteAgrupado>();

      itemsFiltrados.forEach(item => {
        if (!item.product_id) return;
        const producto = productos.find(p => p.id === item.product_id);
        if (!producto || !producto.categoria) return;
        
        const categoria = categorias.find(c => c.id === producto.categoria);
        if (!categoria) return;

        if (!agrupado.has(categoria.id)) {
          agrupado.set(categoria.id, {
            nombre: categoria.nombre,
            cantidadOrdenes: 0,
            cantidadProductos: 0,
            totalVentas: 0,
            totalCostos: 0,
            porcentajeGanancia: 0
          });
        }
        const grupo = agrupado.get(categoria.id)!;
        grupo.cantidadOrdenes += 1;
        grupo.cantidadProductos += Number(item.cantidad || 0);
        grupo.totalVentas += Number(item.subtotal || 0);
        grupo.totalCostos = (grupo.totalCostos || 0) + ((item.valorCompraProducto || 0) * Number(item.cantidad || 0));
        grupo.porcentajeGanancia = calcularPorcentajeGanancia(grupo.totalVentas, grupo.totalCostos!);
      });

      return Array.from(agrupado.values()).sort((a, b) => b.totalVentas - a.totalVentas);
    }

    return [];
  }, [datosFiltrados, tipoAgrupacion, productos, categorias, proveedores, ordenItems]);

  const exportarCSV = () => {
    const headers = tipoAgrupacion === "orden" 
      ? ["Orden", "Fecha", "Cantidad Productos", "Total Costos", "Total Ventas", "Ganancia %"]
      : ["Nombre", "Cantidad Órdenes", "Cantidad Productos", "Total Costos", "Total Ventas", "Ganancia %"];
    
    const rows = datosAgrupados.map(item => {
      const porcentajeFormato = item.porcentajeGanancia !== undefined ? item.porcentajeGanancia.toFixed(2) : "0.00";
      return tipoAgrupacion === "orden"
        ? [item.nombre, item.detalles || '', item.cantidadProductos, item.totalCostos || 0, item.totalVentas, porcentajeFormato]
        : [item.nombre, item.cantidadOrdenes, item.cantidadProductos, item.totalCostos || 0, item.totalVentas, porcentajeFormato];
    });

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-ventas-${fechaInicio}-${fechaFin}.csv`;
    link.click();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="page-header">Reporte de Ventas Mensual</h1>
            <p className="page-subtitle mt-1">Análisis detallado de tus ventas</p>
          </div>
          <Button onClick={exportarCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Resumen Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCLP(totalVentas)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Órdenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrdenes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProductos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros y Agrupación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rango de fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filtroCliente">Cliente</Label>
                <Input
                  id="filtroCliente"
                  placeholder="Buscar por cliente..."
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filtroProducto">Producto</Label>
                <Input
                  id="filtroProducto"
                  placeholder="Buscar por producto..."
                  value={filtroProducto}
                  onChange={(e) => setFiltroProducto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filtroProveedor">Proveedor</Label>
                <Select value={filtroProveedor} onValueChange={(v) => setFiltroProveedor(v)}>
                  <SelectTrigger id="filtroProveedor">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Buscar proveedor..."
                        value={proveedorSearchReporte}
                        onChange={(e) => setProveedorSearchReporte(e.target.value)}
                      />
                    </div>
                    <div className="max-h-56 overflow-auto">
                      {proveedores
                        .filter((p) => {
                          if (!proveedorSearchReporte) return true;
                          return (p.razonsocial || "").toString().toLowerCase().includes(proveedorSearchReporte.toLowerCase());
                        })
                        .map((p) => (
                          <SelectItem key={p.id} value={p.razonsocial}>
                            {p.razonsocial}
                          </SelectItem>
                        ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipo de agrupación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoAgrupacion">Agrupar por</Label>
                <Select value={tipoAgrupacion} onValueChange={(v) => setTipoAgrupacion(v as any)}>
                  <SelectTrigger id="tipoAgrupacion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orden">Órdenes Individuales</SelectItem>
                    <SelectItem value="producto">Producto</SelectItem>
                    <SelectItem value="proveedor">Proveedor</SelectItem>
                    <SelectItem value="categoria">Categoría</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filtroMedioPago">Medio de Pago</Label>
                <Select value={filtroMedioPago} onValueChange={setFiltroMedioPago}>
                  <SelectTrigger id="filtroMedioPago">
                    <SelectValue placeholder="Seleccionar medio de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={cargarDatos} className="w-full sm:w-auto" disabled={loading}>
              {loading ? 'Cargando...' : 'Aplicar Filtros'}
            </Button>
          </CardContent>
        </Card>

        {/* Tabla de resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando datos...</div>
            ) : datosAgrupados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay datos para mostrar</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tipoAgrupacion === "orden" ? "Orden" : "Nombre"}</TableHead>
                      {tipoAgrupacion === "orden" && <TableHead>Fecha</TableHead>}
                      {tipoAgrupacion !== "orden" && <TableHead className="text-right">Órdenes</TableHead>}
                      <TableHead className="text-right">Cant. Productos</TableHead>
                      <TableHead className="text-right">Total Costos</TableHead>
                      <TableHead className="text-right">Total Ventas</TableHead>
                      <TableHead className="text-right">Ganancia %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datosAgrupados.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        {tipoAgrupacion === "orden" && (
                          <TableCell>{item.detalles}</TableCell>
                        )}
                        {tipoAgrupacion !== "orden" && (
                          <TableCell className="text-right">{item.cantidadOrdenes}</TableCell>
                        )}
                        <TableCell className="text-right">{item.cantidadProductos}</TableCell>
                        <TableCell className="text-right">{formatCLP(item.totalCostos || 0)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCLP(item.totalVentas)}</TableCell>
                        <TableCell className={`text-right font-semibold ${item.porcentajeGanancia! > 0 ? "text-green-600 dark:text-green-400" : item.porcentajeGanancia! < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                          {item.porcentajeGanancia?.toFixed(2) || "0.00"}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}