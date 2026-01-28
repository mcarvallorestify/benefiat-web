import React, { useState, useRef } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useProductos } from "@/hooks/useProductos";
import { useClientes } from "@/hooks/useClientes";
import { supabase } from "@/lib/supabaseClient";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Search } from "lucide-react";
import { ChevronDown } from "lucide-react";


const mediosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];
const tiposDocumento = ['Boleta', 'Factura'];
const formatCLP = (value) => value?.toLocaleString('es-CL');

export default function PuntoDeVenta() {
  const { user } = useUser();
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);
  const { clientes: clientesBase, loading: loadingClientesBase } = useClientes(empresa?.id);
  // Local clientes state: puede contener todos (clientesBase) o resultados del servidor filtrados
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState("");
  const [busqueda, setBusqueda] = useState('');
  const { productos, loading: loadingProductos } = useProductos(empresa?.id);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState('');
  const [openCliente, setOpenCliente] = useState(false);
  const [textoabuscar, setTextoabuscar] = useState('');

  // token para ignorar respuestas antiguas
  const searchToken = useRef(0);
  React.useEffect(() => {
    if (!empresa?.id) return;
    const q = textoabuscar?.trim();
    // si q vacío, usar clientesBase (pero espera si aún carga)
    if (!q) {
      setErrorClientes("");
      setLoadingClientes(false);
      if (!loadingClientesBase) setClientes(clientesBase || []);
      return;
    }
    setLoadingClientes(true);
    setErrorClientes("");
    const parts = q.split(/\s+/).filter(Boolean);
    const selectCols = 'tablaID, nombre, apellido, nombreCompleto, email, direccion';
    const myToken = ++searchToken.current;
    const setIfLatest = (data) => {
      if (myToken !== searchToken.current) return;
      setClientes(data || []);
    };
    const setErrorIfLatest = (errMsg) => {
      if (myToken !== searchToken.current) return;
      setErrorClientes(errMsg);
    };
    const finalizeIfLatest = () => {
      if (myToken !== searchToken.current) return;
      setLoadingClientes(false);
    };
    // Si hay dos o más partes, buscamos nombre LIKE first AND apellido LIKE last
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
          finalizeIfLatest();
          if (error) {
            console.error('Error Supabase clientes:', error);
            setErrorIfLatest(error.message || 'Error desconocido');
            setIfLatest([]);
          } else {
            setIfLatest(data);
          }
        });
    } else {
      // Un solo término: buscar en nombre O apellido O nombreCompleto
      const term = parts[0];
      supabase
        .from('user')
        .select(selectCols)
        .eq('empresa', empresa.id)
        .or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%,nombreCompleto.ilike.%${term}%`)
        .then(({ data, error }) => {
          finalizeIfLatest();
          if (error) {
            console.error('Error Supabase clientes:', error);
            setErrorIfLatest(error.message || 'Error desconocido');
            setIfLatest([]);
          } else {
            setIfLatest(data);
          }
        });
    }
  }, [textoabuscar, empresa?.id, loadingClientesBase, clientesBase]);
  React.useEffect(() => {
    if (!textoabuscar || textoabuscar.trim() === "") {
      // Si la lista base aún carga, no sobreescribimos con vacío
      if (loadingClientesBase) return;
      setClientes(clientesBase || []);
    }
  }, [clientesBase, textoabuscar, loadingClientesBase]);

  // Al abrir el selector, cargar todos los clientes (usa clientesBase si ya está disponible)
  React.useEffect(() => {
    if (!openCliente) return;
    if (!empresa?.id) return;
    const selectCols = 'tablaID, nombre, apellido, nombreCompleto, email, direccion';
    if (clientesBase && clientesBase.length > 0) {
      setClientes(clientesBase);
      return;
    }
    setLoadingClientes(true);
    supabase
      .from('user')
      .select(selectCols)
      .eq('empresa', empresa.id)
      .then(({ data, error }) => {
        setLoadingClientes(false);
        if (error) {
          console.error('Error cargando clientes al abrir selector:', error);
          setErrorClientes(error.message || 'Error desconocido');
          setClientes([]);
        } else {
          setClientes(data || []);
        }
      });
  }, [openCliente, empresa?.id, clientesBase]);

  


  const [medioPago, setMedioPago] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('Boleta');
  const [mensaje, setMensaje] = useState('');

  const handleBuscar = (e) => {
    setBusqueda(e.target.value);
    setProductosFiltrados(
      productos.filter((p) =>
        p.nombre.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  React.useEffect(() => {
    if (busqueda.trim() === "") {
      setProductosFiltrados([]);
    } else {
      setProductosFiltrados(
        productos.filter((p) =>
          p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        )
      );
    }
  }, [productos, busqueda]);

  const agregarProducto = (producto) => {
    setCarrito([...carrito, producto]);
  };

  const quitarProducto = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const total = carrito.reduce((sum, p) => sum + p.precio, 0);

  const handlePagar = async () => {
    if (!cliente || !medioPago || carrito.length === 0) {
      setMensaje('Completa todos los campos y agrega productos.');
      return;
    }
    if (!empresa) {
      setMensaje('No se pudo obtener datos de la empresa.');
      return;
    }

    const fechaEmision = new Date().toISOString().slice(0, 10);
    const fechaResolucion = empresa.fechaResolucion || "2023-01-01";
    const numeroResolucion = empresa.numeroResolucion || "80";
    const tipoDTE = tipoDocumento === "Boleta" ? 39 : 33;
    const medioPagoApi = medioPago === "Efectivo" ? "EF" : medioPago === "Tarjeta" ? "TC" : "TR";
    const montoNeto = Math.round(total / 1.19);
    const iva = total - montoNeto;
    const montoTotal = total;

    const detalles = carrito.map((p, idx) => ({
      Nombre: p.nombre,
      Cantidad: 1,
      Precio: p.precio,
      producto_id: p.producto_id 
    }));

    const jsonData = {
      Documento: {
        Encabezado: {
          IdentificacionDTE: {
            TipoDTE: tipoDTE,
            Folio: empresa.siguiente_folio || 2,
            FechaEmision: fechaEmision,
            IndicadorServicio: 3,
            MedioPago: medioPagoApi
          },
          Emisor: {
            Rut: empresa.rutEmpresa,
            RazonSocialBoleta: empresa.razonSocialEmpresa,
            GiroBoleta: empresa.giroEmpresa,
            DireccionOrigen: empresa.direccionEmpresa ,
            ComunaOrigen: empresa.comunaEmpresa
          },
          Totales: {
            MontoNeto: montoNeto,
            IVA: Math.round(iva),
            MontoTotal: montoTotal
          }
        },
        Detalles: detalles
      },
      Certificado: {
        Rut: empresa.rutEmpresa,
        Password: empresa.claveCertificadoDigital
      }
    };

    const formData = new FormData();
    formData.append("json", JSON.stringify(jsonData));
    formData.append("fechaResolucion", fechaResolucion);
    formData.append("numeroResolucion", numeroResolucion);

    setMensaje("Enviando a SII...");
    try {
      const response = await fetch("https://pdv.restify.cl/dte/simpleapi_dte_pdf.php", {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error("Error en la emisión");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setMensaje("Documento emitido correctamente");
      setCarrito([]);
    } catch (err) {
      setMensaje("Error al emitir documento");
    }
  };



  return (
    <AppLayout>
      <div className="w-full mx-auto p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-[#00679F] flex items-center gap-2">
          <svg width="32" height="32" fill="#00679F" viewBox="0 0 24 24"><path d="M7 18c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10c1.654 0 3 1.346 3 3v8c0 1.654-1.346 3-3 3H7zm0-2h10c.551 0 1-.449 1-1V7c0-.551-.449-1-1-1H7c-.551 0-1 .449-1 1v8c0 .551.449 1 1 1zm-2 4c-.553 0-1-.447-1-1s.447-1 1-1h14c.553 0 1 .447 1 1s-.447 1-1 1H5z"></path></svg>
          Punto de Venta
        </h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Columna izquierda: Solo productos */}
          <div className="md:w-2/3 w-full bg-[#F8FBFC] rounded-lg p-6 border border-[#6EDCF8]/40 shadow-sm">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={handleBuscar}
                className="border-2 border-[#6EDCF8] focus:border-[#00679F] rounded-lg p-3 w-full text-lg transition mb-2 bg-white"
              />
              {busqueda.trim() !== '' && (
                <ul className="divide-y divide-[#6EDCF8]/30 bg-white rounded-lg shadow mt-2">
                  {productosFiltrados.length > 0 ? (
                    productosFiltrados.map((p) => (
                      <li key={p.id} className="flex justify-between items-center py-3 px-2 hover:bg-[#6EDCF8]/10 transition">
                        <span className="font-medium text-[#00679F]">{p.nombre}</span>
                        <span className="text-[#00679F] font-bold">${formatCLP(p.precio)}</span>
                        <button
                          className="bg-[#00679F] hover:bg-[#005377] text-white px-3 py-1 rounded-lg ml-4 text-sm font-semibold shadow"
                          onClick={() => agregarProducto(p)}
                        >
                          Agregar
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 py-3 px-2">No hay productos</li>
                  )}
                </ul>
              )}
            </div>
            {/* Carrito debajo del buscador */}
            <div className="mb-2">
              <ul className="divide-y divide-[#6EDCF8]/30 bg-white rounded-lg shadow">
                {carrito.length === 0 && (
                  <li className="text-gray-400 py-3 px-2">No hay productos en el carrito</li>
                )}
                {carrito.map((p, i) => (
                  <li key={i} className="flex justify-between items-center py-3 px-2">
                    <span className="font-medium text-[#00679F]">{p.nombre}</span>
                    <span className="text-[#00679F] font-bold">${formatCLP(p.precio)}</span>
                    <button
                      className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg ml-4 text-sm font-semibold shadow"
                      onClick={() => quitarProducto(i)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
              <div className="font-bold mt-4 text-right text-xl text-[#00679F]">Total: ${formatCLP(total)}</div>
            </div>
          </div>
          {/* Columna derecha: Configuración de venta y Totales */}
          <div className="md:w-1/3 w-full flex flex-col gap-6 bg-[#F8FBFC] rounded-lg p-6 border border-[#6EDCF8]/40 shadow-sm">
            {/* Configuración de venta */}
            <div>
              <label className="block mb-2 text-[#00679F] font-semibold">Cliente</label>
              <div className="relative">
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setOpenCliente(true)}
                  tabIndex={0}
                >
                  <span className="truncate text-left">
                    {cliente
                      ? (() => {
                          const c = clientesBase.find(c => c.tablaID === cliente);
                          if (!c) return 'Selecciona un cliente';
                          const nombre = c["nombreCompleto"] || c["Nombre"] || c.nombre || '';
                          return nombre + (c.direccion ? ' - ' + c.direccion : '');
                        })()
                      : 'Selecciona un cliente'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                </button>

                <Dialog open={openCliente} onOpenChange={setOpenCliente}>
                  <DialogContent className="max-w-3xl w-full">
                    <DialogHeader>
                      <DialogTitle>Seleccionar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre o RUN..."
                          value={textoabuscar}
                          onChange={(e) => setTextoabuscar(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button onClick={() => { setTextoabuscar(''); setClientes(clientesBase || []); }}>Mostrar todos</Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-auto">
                      {(loadingClientes || loadingClientesBase) ? (
                        <div className="col-span-full text-center text-muted-foreground">Cargando clientes...</div>
                      ) : clientes && clientes.length > 0 ? (
                        clientes.map((c) => (
                          <button
                            key={c.tablaID}
                            onClick={() => { setCliente(c.tablaID); setOpenCliente(false); setTextoabuscar(''); }}
                            className="text-left p-3 rounded-lg border hover:shadow-sm bg-white"
                          >
                            <div className="font-medium text-[#00679F]">{c.nombreCompleto || `${(c.nombre || '')} ${(c.apellido || '')}`.trim()}</div>
                            {c.email && <div className="text-sm text-muted-foreground">{c.email}</div>}
                            {c.direccion && <div className="text-sm text-muted-foreground">{c.direccion}</div>}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-full text-center text-muted-foreground">No hay clientes</div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div>
              <label className="block mb-2 text-[#00679F] font-semibold">Medio de Pago</label>
              <Select value={medioPago} onValueChange={setMedioPago}>
                <SelectTrigger className="w-full h-10 text-base">
                  <SelectValue placeholder="Selecciona medio de pago" />
                </SelectTrigger>
                <SelectContent>
                  {mediosPago.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-2 text-[#00679F] font-semibold">Tipo de Documento</label>
              <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                <SelectTrigger className="w-full h-10 text-base">
                  <SelectValue placeholder="Selecciona tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Detalle de totales */}
            <div className="bg-white rounded-lg shadow p-4 mt-2 mb-2 border border-[#6EDCF8]/30">
              <div className="flex justify-between mb-1 text-[#00679F] text-base">
                <span>Subtotal</span>
                <span>${formatCLP(Math.round(total / 1.19))}</span>
              </div>
              <div className="flex justify-between mb-1 text-[#00679F] text-base">
                <span>IVA (19%)</span>
                <span>${formatCLP(Math.round(total - total / 1.19))}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-[#00679F] border-t border-[#6EDCF8]/40 pt-2 mt-2">
                <span>Total</span>
                <span>${formatCLP(total)}</span>
              </div>
            </div>
            <button
              className="bg-[#00679F] hover:bg-[#005377] text-white px-6 py-3 rounded-lg w-full mt-2 text-lg font-bold shadow transition"
              onClick={handlePagar}
            >
              Pagar
            </button>
            {mensaje && <div className="mt-4 text-center text-[#00679F] font-semibold">{mensaje}</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
