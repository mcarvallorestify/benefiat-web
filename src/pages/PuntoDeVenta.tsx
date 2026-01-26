// ...existing code...
function formatCLP(value) {
  return value.toLocaleString('es-CL');
}
import React, { useState } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useProductos } from "@/hooks/useProductos";

// Clientes y otros datos simulados
const clientes = [
  { id: 1, nombre: 'Cliente 1' },
  { id: 2, nombre: 'Cliente 2' },
];
const mediosPago = ['Efectivo', 'Tarjeta', 'Transferencia'];
const tiposDocumento = ['Boleta', 'Factura'];


export default function PuntoDeVenta() {
  const { user } = useUser();
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);
  const [busqueda, setBusqueda] = useState('');
  const { productos, loading: loadingProductos } = useProductos(empresa?.id);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [cliente, setCliente] = useState('');
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

  // Actualizar productosFiltrados cuando cambian los productos o la búsqueda
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
              <select
                value={cliente}
                onChange={e => setCliente(e.target.value)}
                className="border-2 border-[#6EDCF8] focus:border-[#00679F] rounded-lg p-3 w-full text-lg transition bg-white"
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-[#00679F] font-semibold">Medio de Pago</label>
              <select
                value={medioPago}
                onChange={e => setMedioPago(e.target.value)}
                className="border-2 border-[#6EDCF8] focus:border-[#00679F] rounded-lg p-3 w-full text-lg transition bg-white"
              >
                <option value="">Selecciona medio de pago</option>
                {mediosPago.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-[#00679F] font-semibold">Tipo de Documento</label>
              <select
                value={tipoDocumento}
                onChange={e => setTipoDocumento(e.target.value)}
                className="border-2 border-[#6EDCF8] focus:border-[#00679F] rounded-lg p-3 w-full text-lg transition bg-white"
              >
                {tiposDocumento.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
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
