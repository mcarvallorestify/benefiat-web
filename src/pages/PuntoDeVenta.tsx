import React, { useState, useRef } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useProductos } from "@/hooks/useProductos";
import { useClientes } from "@/hooks/useClientes";
import { useSucursales } from "@/hooks/useSucursales";
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
const tiposDocumento = ['Boleta', 'Factura', 'Vale de Venta'];
const formatCLP = (value) => value?.toLocaleString('es-CL');

export default function PuntoDeVenta() {
  const { user } = useUser();
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);
  const { clientes: clientesBase, loading: loadingClientesBase } = useClientes(empresa?.id);
  const { sucursalActual } = useSucursales(empresa?.id);

  // Validación usando tablas respectivas (empresa, sii, certificado_digital)
  const [loadingValidacion, setLoadingValidacion] = useState(false);
  const [empresaDatosOk, setEmpresaDatosOk] = useState(false);
  const [facturacionOk, setFacturacionOk] = useState(false);
  const [certificadoOk, setCertificadoOk] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    if (!empresa?.id) return;
    (async () => {
      setLoadingValidacion(true);
      try {
        const { data: empresaRow } = await supabase
          .from("empresa")
          .select("rutEmpresa, razonSocialEmpresa, nombreEmpresa, giroEmpresa, direccionEmpresa, comunaEmpresa, logo, claveCertificadoDigital")
          .eq("id", empresa.id)
          .maybeSingle();

        const { data: siiRow } = await supabase
          .from("sii")
          .select("numeroResolucion, fechaResolucion, acteco")
          .eq("empresa", empresa.id)
          .maybeSingle();

        const { data: certRow } = await supabase
          .from("certificado_digital")
          .select("id")
          .eq("empresa", empresa.id)
          .maybeSingle();

        if (!mounted) return;

        const datosEmpresaCompletos = !!(
          empresaRow?.rutEmpresa &&
          empresaRow?.razonSocialEmpresa &&
          empresaRow?.nombreEmpresa &&
          empresaRow?.giroEmpresa &&
          empresaRow?.direccionEmpresa &&
          empresaRow?.comunaEmpresa &&
          empresaRow?.logo
        );

        const facturacionCompleta = !!(
          siiRow?.numeroResolucion &&
          siiRow?.fechaResolucion &&
          siiRow?.acteco
        );

        const certificadoCompleto = !!(
          certRow?.id &&
          empresaRow?.claveCertificadoDigital
        );

        setEmpresaDatosOk(datosEmpresaCompletos);
        setFacturacionOk(facturacionCompleta);
        setCertificadoOk(certificadoCompleto);
      } catch (e) {
        if (!mounted) return;
        setEmpresaDatosOk(false);
        setFacturacionOk(false);
        setCertificadoOk(false);
      } finally {
        if (mounted) setLoadingValidacion(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [empresa?.id]);

  const empresaIncompleta = !empresaDatosOk || !facturacionOk || !certificadoOk;

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
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [observaciones, setObservaciones] = useState('');

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
    const selectCols = 'tablaID, nombre, apellido, nombreCompleto, email, direccion, run, dv';
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
    const selectCols = 'tablaID, nombre, apellido, nombreCompleto, email, direccion, run, dv';
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
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const autoPrintTriggeredRef = useRef(false);

  const handleBuscar = (e) => {
    setBusqueda(e.target.value);
    setProductosFiltrados(
      productos.filter((p) =>
        p.nombre.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  const handleBuscarKeyDown = (e) => {
    // Abrir modal para producto personalizado cuando el usuario presiona 0 + Enter
    if (e.key === 'Enter' && e.currentTarget.value.trim() === '0') {
      e.preventDefault();
      setShowCustomModal(true);
    }
  };

  const handleAddCustomProduct = async () => {
    const nombre = (customName || '').trim();
    const precioNum = Number(customPrice);
    if (!nombre || !precioNum || isNaN(precioNum) || precioNum <= 0) {
      // simple validación
      return;
    }

    try {
      // 1. Buscar o crear categoría "Variedades"
      let categoriaId = null;
      const { data: categoriaExistente } = await supabase
        .from("Categoría")
        .select("id")
        .eq("empresa", empresa?.id)
        .eq("nombre", "Variedades")
        .maybeSingle();

      if (categoriaExistente) {
        categoriaId = categoriaExistente.id;
      } else {
        // Crear categoría "Variedades"
        const { data: nuevaCategoria, error: errorCategoria } = await supabase
          .from("Categoría")
          .insert([{ nombre: "Variedades", empresa: empresa?.id }])
          .select("id")
          .single();

        if (errorCategoria) {
          console.error("Error creando categoría Variedades:", errorCategoria);
          setMensaje("Error al crear categoría");
          return;
        }
        categoriaId = nuevaCategoria.id;
      }

      // 2. Crear producto en la base de datos
      const { data: nuevoProducto, error: errorProducto } = await supabase
        .from("Producto")
        .insert([{
          nombre,
          precio: precioNum,
          categoria_id: categoriaId,
          empresa: empresa?.id,
          sucursal: sucursalActual ?? null,
          stock: 0,
          activo: true,
        }])
        .select("id")
        .single();

      if (errorProducto) {
        console.error("Error creando producto:", errorProducto);
        setMensaje("Error al crear producto");
        return;
      }

      const customProduct = {
        id: nuevoProducto.id,
        nombre,
        precio: precioNum,
        producto_id: nuevoProducto.id,
        esVariedades: true,
      };

      // añadir al carrito y también a la lista filtrada para visibilidad
      agregarProducto(customProduct);
      setProductosFiltrados((prev) => [customProduct, ...(prev || [])]);
      setShowCustomModal(false);
      setCustomName('');
      setCustomPrice('');
      setBusqueda('');
    } catch (e) {
      console.error("Error al agregar producto personalizado:", e);
      setMensaje("Error al procesar producto");
    }
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
    setCarrito((prev) => {
      // si ya existe el mismo id, incrementamos la cantidad
      const idx = prev.findIndex((it) => it.id && producto.id && it.id === producto.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: (copy[idx].cantidad || 1) + 1 };
        return copy;
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const quitarProducto = (index) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCantidad = (index, value) => {
    const qty = Math.max(1, Number(value) || 1);
    setCarrito((prev) => prev.map((it, i) => (i === index ? { ...it, cantidad: qty } : it)));
  };

  const incrementCantidad = (index) => {
    setCarrito((prev) => prev.map((it, i) => (i === index ? { ...it, cantidad: (it.cantidad || 1) + 1 } : it)));
  };

  const decrementCantidad = (index) => {
    setCarrito((prev) => prev.map((it, i) => (i === index ? { ...it, cantidad: Math.max(1, (it.cantidad || 1) - 1) } : it)));
  };

  const total = carrito.reduce((sum, p) => sum + (p.precio || 0) * (p.cantidad || 1), 0);

  const ensureCarpeta = async (nombreCarpeta: string) => {
    if (!empresa?.id) return null;
    const { data: existing } = await supabase
      .from("carpetas")
      .select("id, tablaID, nombre")
      .eq("empresa", empresa.id)
      .eq("nombre", nombreCarpeta)
      .maybeSingle();

    if (existing) return existing;

    const { data: created, error } = await supabase
      .from("carpetas")
      .insert([{ nombre: nombreCarpeta, empresa: empresa.id }])
      .select("id, tablaID, nombre")
      .maybeSingle();

    if (error) {
      console.error("Error creando carpeta:", error);
      return null;
    }
    return created;
  };

  const guardarDocumentoEnCarpeta = async (nombreCarpeta: string, urlArchivo: string, fechaDocumento: string) => {
    if (!urlArchivo || !fechaDocumento) return;
    const carpeta = await ensureCarpeta(nombreCarpeta);
    if (!carpeta) return;

    const carpetaKey = (carpeta as any).tablaID ?? (carpeta as any).id;
    const insertObj: any = {
      nombre_archivo: fechaDocumento,
      descripcion: null,
      fecha_documento: fechaDocumento,
      url_archivo: urlArchivo,
      carpeta: carpetaKey,
      created_at: new Date().toISOString(),
    };

    let { error } = await supabase.from("archivos_carpeta").insert([insertObj]);
    if (error) {
      const msg = error.message || "";
      if (/malformed array literal/i.test(msg)) {
        const retryObj = { ...insertObj, url_archivo: [insertObj.url_archivo] };
        const { error: retryErr } = await supabase.from("archivos_carpeta").insert([retryObj]);
        if (retryErr) {
          console.error("Error guardando archivo (retry):", retryErr);
        }
      } else {
        console.error("Error guardando archivo:", error);
      }
    }
  };

  const actualizarStockDespuesVenta = async () => {
    try {
      const productosParaActualizar = carrito.filter(
        (item) => item?.id && !item?.esVariedades
      );

      for (const item of productosParaActualizar) {
        const cantidadVendida = Number(item.cantidad || 1);
        const { data: producto, error } = await supabase
          .from("Producto")
          .select("id, stock")
          .eq("id", item.id)
          .maybeSingle();

        if (error || !producto) {
          console.warn("No se pudo cargar stock del producto:", item.id, error);
          continue;
        }

        const stockActual = Number(producto.stock || 0);
        const nuevoStock = Math.max(0, stockActual - cantidadVendida);

        const { error: updateError } = await supabase
          .from("Producto")
          .update({ stock: nuevoStock })
          .eq("id", item.id);

        if (updateError) {
          console.warn("No se pudo actualizar stock:", item.id, updateError);
        }
      }
    } catch (e) {
      console.warn("Error actualizando stock:", e);
    }
  };

  const crearOrden = async (clienteData: any, montoTotal: number, tipoDoc: string) => {
    try {
      const cantidadTotal = carrito.reduce((sum, p) => sum + (p.cantidad || 1), 0);
      
      const ordenData: any = {
        monto: montoTotal,
        cantidad: cantidadTotal,
        descuento: null,
        estado: "Completado",
        direccionEnvio: clienteData?.direccion || "",
        mediodePago: medioPago,
        observacion: observaciones || `${tipoDoc} - ${tipoDocumento}`,
        numeroContacto: clienteData?.numeroContacto ? Number(clienteData.numeroContacto) : 0,
        usuario: cliente || user?.id || null,
        empresa: empresa?.id || null,
        tienda: sucursalActual ?? null,
        nombre: clienteData?.nombre || null,
        apellido: clienteData?.apellido || null,
        run: clienteData?.run ? Number(clienteData.run) : null,
        dv: clienteData?.dv ? Number(clienteData.dv) : null,
        region: clienteData?.region ? Number(clienteData.region) : null,
        ciudad: clienteData?.ciudad ? Number(clienteData.ciudad) : null,
      };

      const { data: ordenCreada, error } = await supabase.from("Orden").insert([ordenData]).select("id").single();
      
      if (error) {
        console.error("Error creando orden:", error);
        return;
      }

      // Crear orden_items para cada producto del carrito
      if (ordenCreada?.id) {
        const ordenItems = carrito.map((item) => ({
          cantidad: item.cantidad || 1,
          precio: item.precio || 0,
          subtotal: (item.precio || 0) * (item.cantidad || 1),
          nombreProducto: item.nombre,
          product_id: item.id || null,
          orden_id: ordenCreada.id,
          valorCompraProducto: item.precio_compra_coniva || null,
        }));

        const { error: itemsError } = await supabase.from("orden_items").insert(ordenItems);
        
        if (itemsError) {
          console.error("Error creando orden_items:", itemsError);
        }
      }

      // Limpiar observaciones después de crear la orden
      setObservaciones('');
    } catch (e) {
      console.error("Error al crear orden:", e);
    }
  };

  const handlePrintPdf = async () => {
    try {
      if (!pdfUrl) return;
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 2000);
      }
    } catch (e) {
      console.error('Error al imprimir:', e);
    }
  };

  React.useEffect(() => {
    if (!openPdfModal || !pdfUrl) {
      autoPrintTriggeredRef.current = false;
      return;
    }

    if (!autoPrintTriggeredRef.current) {
      autoPrintTriggeredRef.current = true;
      setTimeout(() => {
        handlePrintPdf();
      }, 300);
    }
  }, [openPdfModal, pdfUrl]);

  const handlePagar = async () => {
    if (!cliente || !medioPago || carrito.length === 0) {
      setMensaje('Completa todos los campos y agrega productos.');
      return;
    }
    if (!empresa) {
      setMensaje('No se pudo obtener datos de la empresa.');
      return;
    }

    // Obtener datos del cliente (run y dv)
    const clienteData = clientesBase?.find(c => c.tablaID === cliente);
    if (!clienteData || !clienteData.run || !clienteData.dv) {
      setMensaje('El cliente no tiene RUN completo.');
      return;
    }

    const rutReceptor = `${clienteData.run}-${clienteData.dv}`;
    const fechaEmision = new Date().toISOString().slice(0, 10);
    const montoNeto = Math.round(total / 1.19);
    const iva = total - montoNeto;
    const montoTotal = total;

    const detalles = carrito.map((p) => {
      const precioUnitario = p.precio || 0;
      const cantidad = p.cantidad || 1;
      const montoItem = precioUnitario * cantidad;
      
      return {
        Nombre: p.nombre,
        Cantidad: cantidad,
        UnidadMedida: "un",
        Precio: precioUnitario,
        MontoItem: montoItem
      };
    });

    // Si es Vale de Venta, usar endpoint diferente sin SII
    if (tipoDocumento === "Vale de Venta") {
      const jsonDataVale = {
        Documento: {
          Encabezado: {
            IdentificacionDTE: {
              FechaEmision: fechaEmision
            },
            Emisor: {
              Rut: empresa.rutEmpresa,
              RazonSocialBoleta: empresa.razonSocialEmpresa,
              GiroBoleta: empresa.giroEmpresa,
              DireccionOrigen: empresa.direccionEmpresa,
              ComunaOrigen: empresa.comunaEmpresa
            },
            Receptor: {
              RazonSocial: clienteData.nombreCompleto || `${clienteData.nombre} ${clienteData.apellido}`,
              Rut: rutReceptor,
              Direccion: clienteData.direccion || "",
              Comuna: clienteData.comuna || ""
            },
            Totales: {
              MontoNeto: montoNeto,
              IVA: Math.round(iva),
              MontoTotal: montoTotal
            }
          },
          Detalles: detalles
        }
      };

      const formData = new FormData();
      formData.append("json", JSON.stringify(jsonDataVale));

      setMensaje("Generando Vale de Venta...");
      try {
        const response = await fetch("https://pdv.restify.cl/dte/simpleapi_vale_pdf.php", {
          method: "POST",
          body: formData
        });
        if (!response.ok) throw new Error("Error en la generación");
        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || "Error en la generación");
        }

        setPdfUrl(`https://pdv.restify.cl/dte${result.archivos.pdf}`);
        setOpenPdfModal(true);
        setMensaje("Vale de venta generado correctamente");
        
        // Crear orden en la base de datos
        await crearOrden(clienteData, montoTotal, "Vale de Venta");
        await actualizarStockDespuesVenta();
        
        setCarrito([]);
      } catch (err) {
        setMensaje("Error al generar vale de venta");
      }
    } else {
      // Boleta o Factura (DTE)
      const fechaResolucion = empresa.fechaResolucion || "2023-01-01";
      const numeroResolucion = empresa.numeroResolucion || "80";
      const tipoDTE = tipoDocumento === "Boleta" ? 39 : 33;

      const jsonData = {
        Documento: {
          Encabezado: {
            IdentificacionDTE: {
              TipoDTE: tipoDTE,
              Folio: empresa.siguiente_folio || 2,
              FechaEmision: fechaEmision,
              IndicadorServicio: 3
            },
            Emisor: {
              Rut: empresa.rutEmpresa,
              RazonSocialBoleta: empresa.razonSocialEmpresa,
              GiroBoleta: empresa.giroEmpresa,
              DireccionOrigen: empresa.direccionEmpresa,
              ComunaOrigen: empresa.comunaEmpresa
            },
            Receptor: {
              Rut: rutReceptor,
              Direccion: clienteData.direccion || "",
              Comuna: clienteData.comuna || "",
              Contacto: clienteData.telefono || ""
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
        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || "Error en la emisión");
        }

        const documentoUrl = `https://pdv.restify.cl/dte${result.archivos.pdf}`;
        const carpetaNombre = tipoDocumento === "Boleta" ? "Boletas Electrónicas" : "Facturas Electrónicas";
        const nombreArchivo = fechaEmision;

        await guardarDocumentoEnCarpeta(carpetaNombre, documentoUrl, nombreArchivo);

        setPdfUrl(documentoUrl);
        setOpenPdfModal(true);
        setMensaje("Documento emitido correctamente");
        
        // Crear orden en la base de datos
        await crearOrden(clienteData, montoTotal, tipoDocumento);
        await actualizarStockDespuesVenta();
        
        setCarrito([]);
      } catch (err) {
        setMensaje("Error al emitir documento");
      }
    }
  };



  return (
    <AppLayout>
      {loadingEmpresa || loadingValidacion ? (
        <div className="w-full mx-auto p-4 bg-white rounded-xl shadow-lg text-center text-muted-foreground">
          Cargando validación de la empresa...
        </div>
      ) : empresaIncompleta ? (
        <div className="w-full mx-auto p-4 bg-white rounded-xl shadow-lg">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">⚠️ Configuración Incompleta</h2>
            <p className="text-yellow-700 mb-4">
              Para usar Punto de Ventas, debe completar todos los datos en las pestañas:
            </p>
            <ul className="text-left text-yellow-700 mb-4 space-y-2 max-w-md mx-auto">
              <li>✓ <strong>Datos Empresa (tabla empresa):</strong> RUT, Razón Social, Nombre, Giro, Dirección, Comuna, Logo.</li>
              <li>✓ <strong>Facturación (tabla sii):</strong> Resolución SII, Fecha Resolución, Acteco.</li>
              <li>✓ <strong>Certificado (tabla certificado_digital):</strong> Certificado válido y clave registrada.</li>
            </ul>
            <a href="/configuracion" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
              Ir a Configuración
            </a>
          </div>
        </div>
      ) : (
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
                onKeyDown={handleBuscarKeyDown}
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
                  <li key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium text-[#00679F] truncate">{p.nombre}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center border rounded-md overflow-hidden">
                          <button
                            className="px-3 py-1 bg-[#f1f9fb] hover:bg-[#e0f3f8] text-[#00679F]"
                            onClick={() => decrementCantidad(i)}
                          >
                            −
                          </button>
                          <div className="px-3 py-1 bg-white text-[#00679F] font-medium">{p.cantidad || 1}</div>
                          <button
                            className="px-3 py-1 bg-[#f1f9fb] hover:bg-[#e0f3f8] text-[#00679F]"
                            onClick={() => incrementCantidad(i)}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[#00679F] font-bold">${formatCLP((p.precio || 0) * (p.cantidad || 1))}</span>
                      </div>
                      <button
                        className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm font-semibold shadow sm:ml-2 w-full sm:w-auto"
                        onClick={() => quitarProducto(i)}
                      >
                        Quitar
                      </button>
                    </div>
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
                            const c = (clientesBase || []).find(c => c.tablaID === cliente);
                            if (!c) return 'Selecciona un cliente';
                            const nombre = c.nombreCompleto || `${(c.nombre || '')} ${(c.apellido || '')}`.trim() || c.Nombre || '';
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
                  <Dialog open={showCustomModal} onOpenChange={setShowCustomModal}>
                    <DialogContent className="max-w-md w-full">
                      <DialogHeader>
                        <DialogTitle>Agregar producto personalizado</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-3">
                        <Input placeholder="Nombre del producto" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Precio (ej: 1500)"
                          maxLength={10}
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={() => { setShowCustomModal(false); setCustomName(''); setCustomPrice(''); }}>Cancelar</Button>
                          <Button onClick={handleAddCustomProduct}>Añadir y agregar al carrito</Button>
                        </div>
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
            <div>
              <label className="block mb-2 text-[#00679F] font-semibold">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas u observaciones de la venta..."
                className="w-full h-20 px-3 py-2 text-base border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
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
      )}

      {/* Modal PDF */}
      <Dialog open={openPdfModal} onOpenChange={setOpenPdfModal}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <div className="flex justify-between items-center">
              <DialogTitle>Documento Emitido</DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto px-6 py-4">
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              style={{ minHeight: '500px' }}
            />
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpenPdfModal(false)}
            >
              Cerrar
            </Button>
            <Button
              className="bg-[#00679F] hover:bg-[#005377] text-white"
              onClick={handlePrintPdf}
            >
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
