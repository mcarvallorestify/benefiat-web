// --- Componente MesaDraggable ---
interface MesaDraggableProps {
  mesa: Mesa;
  mesaSeleccionada: Mesa | null;
  onSeleccionar: (mesa: Mesa) => void;
  onMover: (id: number, x: number, y: number) => void;
}

const MesaDraggable: React.FC<MesaDraggableProps> = ({ mesa, mesaSeleccionada, onSeleccionar, onMover }) => {
  const [dragging, setDragging] = React.useState(false);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [pos, setPos] = React.useState({ x: mesa.x, y: mesa.y });
  const ref = React.useRef<HTMLDivElement>(null);

  // Obtener zoom y offset globales
  const zoom = (window as any).zoomRef?.current ?? 1;
  const boardOffset = (window as any).offsetRef?.current ?? { x: 0, y: 0 };

  React.useEffect(() => {
    setPos({ x: mesa.x, y: mesa.y });
  }, [mesa.x, mesa.y]);

  // Para evitar bug de click moviendo la mesa con zoom, solo iniciar drag si hay movimiento
  function onMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    // Guardar posición inicial para detectar drag real
    const startX = e.clientX;
    const startY = e.clientY;
    const handleMove = (moveEvent: MouseEvent) => {
      const dx = Math.abs(moveEvent.clientX - startX);
      const dy = Math.abs(moveEvent.clientY - startY);
      if (dx > 2 || dy > 2) { // Umbral mínimo para considerar drag
        setDragging(true);
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
          setOffset({
            x: (startX - rect.left) / zoom,
            y: (startY - rect.top) / zoom
          });
        }
        document.body.style.userSelect = 'none';
        window.removeEventListener('mousemove', handleMove);
      }
    };
    window.addEventListener('mousemove', handleMove);
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mouseup', handleUp);
  }

  React.useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;
      // Calcular posición real considerando offset y zoom globales
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      let x = (e.clientX - parentRect.left - boardOffset.x) / zoom - offset.x;
      let y = (e.clientY - parentRect.top - boardOffset.y) / zoom - offset.y;
      x = Math.max(0, Math.min(x, SALON_WIDTH - mesa.ancho));
      y = Math.max(0, Math.min(y, SALON_HEIGHT - mesa.largo));
      setPos({ x, y });
    }
    function onMouseUp(e: MouseEvent) {
      if (!dragging) return;
      setDragging(false);
      document.body.style.userSelect = '';
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      let x = (e.clientX - parentRect.left - boardOffset.x) / zoom - offset.x;
      let y = (e.clientY - parentRect.top - boardOffset.y) / zoom - offset.y;
      x = Math.max(0, Math.min(x, SALON_WIDTH - mesa.ancho));
      y = Math.max(0, Math.min(y, SALON_HEIGHT - mesa.largo));
      setPos({ x, y });
      onMover(mesa.id, x, y);
    }
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, offset, mesa, onMover, zoom, boardOffset]);

  return (
    <div
      ref={ref}
      title={mesa.nombre}
      className={`mesa-draggable absolute flex flex-col items-center justify-center cursor-pointer group select-none
        ${mesaSeleccionada?.id === mesa.id ? 'z-20 animate-bounce' : 'z-10'}
        ${dragging ? 'opacity-80 scale-105' : ''}
      `}
      style={{
        left: pos.x,
        top: pos.y,
        width: mesa.forma === 'circular' ? mesa.ancho : mesa.ancho,
        height: mesa.forma === 'circular' ? mesa.ancho : mesa.largo,
        borderRadius: mesa.forma === 'circular' ? '50%' : '1rem',
        background: mesaSeleccionada?.id === mesa.id
          ? 'linear-gradient(135deg, #e0f2fe 60%, #bae6fd 100%)'
          : 'linear-gradient(135deg, #f1f5f9 60%, #e0e7ef 100%)',
        border: mesaSeleccionada?.id === mesa.id ? '2.5px solid #2563eb' : '1.5px solid #cbd5e1',
        boxShadow: mesaSeleccionada?.id === mesa.id ? '0 8px 32px #60a5fa55' : '0 2px 12px #cbd5e188',
        transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
        filter: mesaSeleccionada?.id === mesa.id ? 'brightness(1.08)' : 'none',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={onMouseDown}
      onClick={e => { if (!dragging) onSeleccionar(mesa); }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px #60a5fa77';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = mesaSeleccionada?.id === mesa.id
          ? '0 8px 32px #60a5fa55'
          : '0 2px 12px #cbd5e188';
      }}
    >
      <span className="text-3xl mb-1" role="img" aria-label="Mesa">
        {mesa.forma === 'circular' ? '🟢' : '🟦'}
      </span>
      <span className="font-semibold text-base text-blue-900 text-center px-1 truncate w-full group-hover:scale-110 transition-transform">
        {mesa.nombre}
      </span>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useUser } from '../hooks/useUser';
import { useUserRole } from '../hooks/useUserRole';
import { useEmpresa } from '../hooks/useEmpresa';
import { useProductos } from '../hooks/useProductos';
import { useSucursales } from '../hooks/useSucursales';
import { supabase } from '../lib/supabaseClient';
import { Navbar } from '@/components/layout/Navbar';

const SALON_WIDTH = 900;
const SALON_HEIGHT = 500;

interface Mesa {
  id: number;
  nombre: string;
  x: number;
  y: number;
  ancho: number;
  largo: number;
  forma?: 'rectangular' | 'circular';
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

// --- FIN MesaDraggable ---

export default function RestauranteMesas() {
    // ...existing code...
  const { user } = useUser();
  const { role } = useUserRole(user?.id);
  const { empresa } = useEmpresa(user?.id);
  const { productos } = useProductos(empresa?.id);

  // Hook de sucursales
  const {
    sucursales,
    sucursalActual,
    cambiarSucursal,
    planInfo,
    loading: loadingSucursales,
    error: errorSucursales,
  } = useSucursales(empresa?.id ?? null);

  // Determinar si el usuario es Administrador usando useUserRole
  const esAdmin = role === 'Administrador';

  // Si no es admin, usar sucursal por defecto del usuario
  React.useEffect(() => {
    if (!esAdmin && user?.sucursal && sucursalActual !== user.sucursal) {
      cambiarSucursal(user.sucursal);
    }
  }, [esAdmin, user, sucursalActual, cambiarSucursal]);

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [showAddMesa, setShowAddMesa] = useState(false);
  const [nuevaMesa, setNuevaMesa] = useState({
    nombre: '',
    ancho: 120,
    largo: 120,
    forma: 'rectangular' as 'rectangular' | 'circular',
    lugarMesa: 1, // Piso por defecto
  });
  const [pisoSeleccionado, setPisoSeleccionado] = useState<number | null>(1);
  const pisoValido = typeof pisoSeleccionado === 'number' && !isNaN(pisoSeleccionado);
  const [lugares, setLugares] = useState<{ id: number, lugarMesa: string }[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [carritos, setCarritos] = useState<Record<number, Producto[]>>({});
  const [busqueda, setBusqueda] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState('Vale de Venta');
  const [mensaje, setMensaje] = useState('');
  const [imprimiendo, setImprimiendo] = useState(false);

  const [zoom, setZoom] = useState(1);
  // Offset de la pizarra infinita
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [draggingBoard, setDraggingBoard] = useState(false);
  const [lastPointer, setLastPointer] = useState<{ x: number; y: number } | null>(null);


  // --- Eliminado useEffect manual de sucursales, ahora solo se usa useSucursales ---

  // Cargar pisos disponibles desde la tabla lugarMesa, filtrando por empresa y sucursal
  useEffect(() => {
    async function fetchLugares() {
      if (!empresa?.id || !sucursalActual) return;
      const { data, error } = await supabase
        .from('lugarMesa')
        .select('id, lugarMesa')
        .eq('empresa', empresa.id)
        .eq('sucursal', sucursalActual);
      if (!error && data) {
        // Evitar duplicados por id
        const unicos = Array.from(new Set(data.map((p: any) => p.id)))
          .map(id => {
            const item = data.find((p: any) => p.id === id);
            return { id, lugarMesa: item.lugarMesa };
          });
        setLugares(unicos);
        // Si no hay lugares, dejar pisoSeleccionado en null
        if (unicos.length === 0) {
          setPisoSeleccionado(null);
        } else {
          // Si el lugar actual no está, seleccionar el primero
          if (!unicos.some(l => l.id === pisoSeleccionado)) {
            setPisoSeleccionado(unicos[0].id);
          }
        }
      }
    }
    fetchLugares();
  }, [empresa, sucursalActual]);

  // Cargar mesas desde la BD filtrando por empresa, sucursal y piso
  useEffect(() => {
    async function fetchMesas() {
      if (!empresa?.id || !user?.id || !sucursalActual || !pisoValido) return;
      const { data, error } = await supabase
        .from('mesa')
        .select('*')
        .eq('empresa', empresa.id)
        .eq('sucursal', sucursalActual)
        .eq('lugarMesa', pisoSeleccionado);
      if (!error && data) {
        setMesas(data.map((m: any) => ({
          id: m.id,
          nombre: m.nombreMesa,
          x: m.x,
          y: m.y,
          ancho: m.ancho,
          largo: m.largo,
          forma: m.forma ?? 'rectangular',
          lugarMesa: m.lugarMesa,
        })));
      }
    }
    fetchMesas();
  }, [empresa, user, pisoSeleccionado, sucursalActual, pisoValido]);


  function abrirDialogAgregarMesa() {
    // Si no hay lugares, dejar pisoSeleccionado en null
    if (lugares.length === 0) {
      setPisoSeleccionado(null);
      setNuevaMesa({
        nombre: `Mesa ${mesas.length + 1}`,
        ancho: 120,
        largo: 120,
        forma: 'rectangular',
        lugarMesa: null,
      });
    } else {
      setNuevaMesa({
        nombre: `Mesa ${mesas.length + 1}`,
        ancho: 120,
        largo: 120,
        forma: 'rectangular',
        lugarMesa: pisoSeleccionado,
      });
    }
    setShowAddMesa(true);
  }

  async function handleAgregarMesa() {
    if (!pisoValido) return;
    // Guardar nueva mesa en la BD
    const { data, error } = await supabase
      .from('mesa')
      .insert([
        {
          nombreMesa: nuevaMesa.nombre,
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 100,
          ancho: nuevaMesa.ancho,
          largo: nuevaMesa.largo,
          forma: nuevaMesa.forma,
          empresa: empresa.id,
          sucursal: sucursalActual,
          lugarMesa: pisoSeleccionado,
        }
      ]);
    setShowAddMesa(false);
    // Refrescar mesas
    if (!error) {
      const { data: mesasActualizadas } = await supabase
        .from('mesa')
        .select('*')
        .eq('empresa', empresa.id)
        .eq('sucursal', sucursalActual)
        .eq('lugarMesa', pisoSeleccionado);
      setMesas(mesasActualizadas.map((m: any) => ({
        id: m.id,
        nombre: m.nombreMesa,
        x: m.x,
        y: m.y,
        ancho: m.ancho,
        largo: m.largo,
        forma: m.forma ?? 'rectangular',
        lugarMesa: m.lugarMesa,
      })));
    }
  }

  async function handleMoverMesa(id: number, x: number, y: number) {
    // Actualizar posición en la BD
    await supabase
      .from('mesa')
      .update({ x, y })
      .eq('id', id);
    setMesas(mesas => mesas.map(m => m.id === id ? { ...m, x, y } : m));
  }

  function handleSeleccionarMesa(mesa: Mesa) {
    setMesaSeleccionada(mesa);
    setShowDialog(true);
  }

  function agregarProductoAMesa(mesaId: number, producto: Producto) {
    setCarritos(prev => {
      const carrito = prev[mesaId] || [];
      const idx = carrito.findIndex(p => p.id === producto.id);
      if (idx !== -1) {
        const nuevo = [...carrito];
        nuevo[idx] = { ...nuevo[idx], cantidad: nuevo[idx].cantidad + 1 };
        return { ...prev, [mesaId]: nuevo };
      }
      return { ...prev, [mesaId]: [...carrito, { ...producto, cantidad: 1 }] };
    });
  }

  function quitarProductoDeMesa(mesaId: number, productoId: number) {
    setCarritos(prev => {
      const carrito = prev[mesaId] || [];
      return { ...prev, [mesaId]: carrito.filter(p => p.id !== productoId) };
    });
  }

  function cambiarCantidad(mesaId: number, productoId: number, cantidad: number) {
    setCarritos(prev => {
      const carrito = prev[mesaId] || [];
      return {
        ...prev,
        [mesaId]: carrito.map(p => p.id === productoId ? { ...p, cantidad } : p)
      };
    });
  }

  function subtotalMesa(mesaId: number) {
    return (carritos[mesaId] || []).reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  }

  function handleBuscar(e: React.ChangeEvent<HTMLInputElement>) {
    setBusqueda(e.target.value);
    setProductosFiltrados(
      productos.filter((p: any) =>
        p.nombre.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  }

  async function cerrarMesa(mesa: Mesa) {
    // Aquí deberías emitir el documento según tipoDocumento y limpiar el carrito
    setMensaje('Procesando...');
    setImprimiendo(true);
    setTimeout(() => {
      setMensaje('Mesa cerrada y documento emitido (simulado)');
      setCarritos(prev => ({ ...prev, [mesa.id]: [] }));
      setImprimiendo(false);
    }, 1500);
  }

  async function imprimirComanda(mesa: Mesa) {
    setMensaje('Imprimiendo comanda (simulado)');
    setImprimiendo(true);
    setTimeout(() => {
      setMensaje('Comanda enviada a cocina (simulado)');
      setImprimiendo(false);
    }, 1200);
  }

  // Referencia para exponer zoom y offset a los hijos
  const zoomRef = React.useRef(zoom);
  const offsetRef = React.useRef(offset);
  React.useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  React.useEffect(() => { offsetRef.current = offset; }, [offset]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <h1 className="text-2xl font-bold mb-4">Plano del Restaurante</h1>
        <div className="mb-4 flex gap-2 items-center">
          {esAdmin && (
            <>
              <span className="text-sm text-gray-500">Sucursal:</span>
              <Select
                value={sucursalActual ? String(sucursalActual) : ''}
                onValueChange={val => cambiarSucursal(Number(val))}
              >
                <SelectTrigger className="min-w-[160px] border rounded px-2 py-1">
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Button onClick={abrirDialogAgregarMesa} disabled={!pisoValido || lugares.length === 0}>Agregar Mesa</Button>
          <span className="text-sm text-gray-500">Arrastra las mesas para ubicarlas</span>
          <span className="text-sm text-gray-500 ml-4">Lugar:</span>
          <Select
            value={pisoValido ? String(pisoSeleccionado!) : ''}
            onValueChange={val => {
              const num = Number(val);
              setPisoSeleccionado(!isNaN(num) ? num : null);
            }}
            disabled={lugares.length === 0}
          >
            <SelectTrigger className="min-w-[120px] border rounded px-2 py-1">
              <SelectValue placeholder="Sin lugares" />
            </SelectTrigger>
            <SelectContent>
              {lugares.length === 0 ? (
                <SelectItem value="">Sin lugares</SelectItem>
              ) : (
                lugares.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.lugarMesa}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!pisoValido && <span className="text-red-500 text-xs ml-2">Selecciona un lugar válido</span>}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} title="Alejar" aria-label="Alejar">
            <span className="text-xl">-</span>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(1)} title="Restablecer zoom" aria-label="Restablecer zoom">
            <span className="text-lg">100%</span>
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} title="Acercar" aria-label="Acercar">
            <span className="text-xl">+</span>
          </Button>
          <span className="ml-2 text-gray-500 text-sm">Zoom: {(zoom * 100).toFixed(0)}%</span>
        </div>

        <div
          className="relative border rounded bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg select-none"
          style={{ width: SALON_WIDTH, height: SALON_HEIGHT, overflow: 'hidden', cursor: draggingBoard ? 'grabbing' : 'grab' }}
          onPointerDown={e => {
            // Solo arrastrar si no se hace click sobre una mesa
            if ((e.target as HTMLElement).closest('.mesa-draggable')) return;
            setDraggingBoard(true);
            setLastPointer({ x: e.clientX, y: e.clientY });
            setMesaSeleccionada(null); // Deseleccionar mesa al click fondo
          }}
        >
          <div
            style={{
              width: SALON_WIDTH,
              height: SALON_HEIGHT,
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: draggingBoard ? 'none' : 'transform 0.2s',
              position: 'relative',
            }}
          >
            {mesas.map(mesa => (
              <MesaDraggable
                key={mesa.id}
                mesa={mesa}
                mesaSeleccionada={mesaSeleccionada}
                onSeleccionar={handleSeleccionarMesa}
                onMover={handleMoverMesa}
              />
            ))}
          </div>
        </div>

        {/* Overlay para arrastrar la pizarra y deseleccionar mesa si se hace click */}
        {draggingBoard && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'grabbing' }}
            onMouseMove={e => {
              if (!lastPointer) return;
              setOffset(prev => ({
                x: prev.x + (e.movementX),
                y: prev.y + (e.movementY),
              }));
              setLastPointer({ x: e.clientX, y: e.clientY });
            }}
            onMouseUp={e => {
              setDraggingBoard(false);
              setLastPointer(null);
              setMesaSeleccionada(null); // Deseleccionar mesa si se suelta click en fondo
            }}
            onPointerDown={e => {
              if (!(e.target as HTMLElement).closest('.mesa-draggable')) {
                setMesaSeleccionada(null);
              }
            }}
          />
        )}

        {/* Modal para agregar mesa */}
        <Dialog open={showAddMesa} onOpenChange={setShowAddMesa}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Agregar Mesa</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={nuevaMesa.nombre}
                onChange={e => setNuevaMesa({ ...nuevaMesa, nombre: e.target.value })}
                placeholder={`Mesa ${mesas.length + 1}`}
              />
              <label className="text-sm font-medium">Forma</label>
              <div className="flex gap-2">
                <Button
                  variant={nuevaMesa.forma === 'rectangular' ? 'default' : 'outline'}
                  onClick={() => setNuevaMesa({ ...nuevaMesa, forma: 'rectangular' })}
                >
                  Rectangular
                </Button>
                <Button
                  variant={nuevaMesa.forma === 'circular' ? 'default' : 'outline'}
                  onClick={() => setNuevaMesa({ ...nuevaMesa, forma: 'circular' })}
                >
                  Circular
                </Button>
              </div>
              {nuevaMesa.forma === 'rectangular' ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Ancho</label>
                    <Input
                      type="number"
                      min={80}
                      max={300}
                      value={nuevaMesa.ancho}
                      onChange={e => setNuevaMesa({ ...nuevaMesa, ancho: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Largo</label>
                    <Input
                      type="number"
                      min={80}
                      max={300}
                      value={nuevaMesa.largo}
                      onChange={e => setNuevaMesa({ ...nuevaMesa, largo: Number(e.target.value) })}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <label className="text-sm font-medium">Diámetro</label>
                  <Input
                    type="number"
                    min={80}
                    max={300}
                    value={nuevaMesa.ancho}
                    onChange={e => setNuevaMesa({ ...nuevaMesa, ancho: Number(e.target.value) })}
                  />
                </div>
              )}
              <Button onClick={handleAgregarMesa} className="mt-2">Agregar</Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Detalle de mesa */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="min-w-[350px]">
            {mesaSeleccionada && (
              <div>
                <DialogHeader>
                  <DialogTitle>{mesaSeleccionada.nombre}</DialogTitle>
                </DialogHeader>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm font-medium">Forma:</span>
                  <Button
                    variant={mesaSeleccionada.forma === 'rectangular' ? 'default' : 'outline'}
                    size="sm"
                    onClick={async () => {
                      if (mesaSeleccionada.forma !== 'rectangular') {
                        await supabase
                          .from('mesa')
                          .update({ forma: 'rectangular' })
                          .eq('id', mesaSeleccionada.id);
                        setMesaSeleccionada(m => m ? { ...m, forma: 'rectangular' } : m);
                        setMesas(mesas => mesas.map(m => m.id === mesaSeleccionada.id ? { ...m, forma: 'rectangular' } : m));
                      }
                    }}
                  >Rectangular</Button>
                  <Button
                    variant={mesaSeleccionada.forma === 'circular' ? 'default' : 'outline'}
                    size="sm"
                    onClick={async () => {
                      if (mesaSeleccionada.forma !== 'circular') {
                        await supabase
                          .from('mesa')
                          .update({ forma: 'circular' })
                          .eq('id', mesaSeleccionada.id);
                        setMesaSeleccionada(m => m ? { ...m, forma: 'circular' } : m);
                        setMesas(mesas => mesas.map(m => m.id === mesaSeleccionada.id ? { ...m, forma: 'circular' } : m));
                      }
                    }}
                  >Circular</Button>
                </div>
                {/* Edición de tamaño */}
                <div className="mb-4 flex gap-2">
                  {mesaSeleccionada.forma === 'rectangular' ? (
                    <>
                      <div className="flex-1">
                        <label className="text-sm font-medium">Ancho</label>
                        <Input
                          type="number"
                          min={80}
                          max={300}
                          value={mesaSeleccionada.ancho}
                          onChange={async e => {
                            const nuevo = Number(e.target.value);
                            await supabase
                              .from('mesa')
                              .update({ ancho: nuevo })
                              .eq('id', mesaSeleccionada.id);
                            setMesaSeleccionada(m => m ? { ...m, ancho: nuevo } : m);
                            setMesas(mesas => mesas.map(m => m.id === mesaSeleccionada.id ? { ...m, ancho: nuevo } : m));
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium">Largo</label>
                        <Input
                          type="number"
                          min={80}
                          max={300}
                          value={mesaSeleccionada.largo}
                          onChange={async e => {
                            const nuevo = Number(e.target.value);
                            await supabase
                              .from('mesa')
                              .update({ largo: nuevo })
                              .eq('id', mesaSeleccionada.id);
                            setMesaSeleccionada(m => m ? { ...m, largo: nuevo } : m);
                            setMesas(mesas => mesas.map(m => m.id === mesaSeleccionada.id ? { ...m, largo: nuevo } : m));
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1">
                      <label className="text-sm font-medium">Diámetro</label>
                      <Input
                        type="number"
                        min={80}
                        max={300}
                        value={mesaSeleccionada.ancho}
                        onChange={async e => {
                          const nuevo = Number(e.target.value);
                          await supabase
                            .from('mesa')
                            .update({ ancho: nuevo })
                            .eq('id', mesaSeleccionada.id);
                          setMesaSeleccionada(m => m ? { ...m, ancho: nuevo } : m);
                          setMesas(mesas => mesas.map(m => m.id === mesaSeleccionada.id ? { ...m, ancho: nuevo } : m));
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <Input
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={handleBuscar}
                    className="mb-2"
                  />
                  {busqueda && (
                    <ul className="divide-y bg-white rounded shadow max-h-40 overflow-y-auto">
                      {productosFiltrados.length > 0 ? (
                        productosFiltrados.map((p) => (
                          <li key={p.id} className="flex justify-between items-center py-2 px-2 hover:bg-blue-50">
                            <span>{p.nombre}</span>
                            <span>${p.precio}</span>
                            <Button size="sm" onClick={() => agregarProductoAMesa(mesaSeleccionada.id, p)}>
                              Agregar
                            </Button>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400 py-2 px-2">No hay productos</li>
                      )}
                    </ul>
                  )}
                </div>
                <h3 className="font-semibold mb-2">Productos en la mesa</h3>
                <ul className="mb-2 divide-y">
                  {(carritos[mesaSeleccionada.id] || []).map(prod => (
                    <li key={prod.id} className="flex justify-between items-center py-1">
                      <span>{prod.nombre}</span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => cambiarCantidad(mesaSeleccionada.id, prod.id, Math.max(1, prod.cantidad - 1))}>-</Button>
                        <span className="mx-1">x{prod.cantidad}</span>
                        <Button size="sm" variant="outline" onClick={() => cambiarCantidad(mesaSeleccionada.id, prod.id, prod.cantidad + 1)}>+</Button>
                        <span className="ml-2">${prod.precio * prod.cantidad}</span>
                        <Button size="icon" variant="ghost" onClick={() => quitarProductoDeMesa(mesaSeleccionada.id, prod.id)}>
                          🗑️
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="font-bold mb-4">
                  Subtotal: ${subtotalMesa(mesaSeleccionada.id)}
                </div>
                <div className="flex gap-2 mb-2">
                  <Select
                    value={tipoDocumento}
                    onValueChange={setTipoDocumento}
                  >
                    <SelectTrigger className="min-w-[120px] border rounded px-2 py-1">
                      <SelectValue placeholder="Tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vale de Venta">Vale de Venta</SelectItem>
                      <SelectItem value="Boleta">Boleta</SelectItem>
                      <SelectItem value="Factura">Factura</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="default" disabled={imprimiendo || (carritos[mesaSeleccionada.id]?.length ?? 0) === 0} onClick={() => cerrarMesa(mesaSeleccionada)}>
                    {imprimiendo ? 'Procesando...' : 'Cerrar Mesa'}
                  </Button>
                  <Button variant="secondary" disabled={imprimiendo || (carritos[mesaSeleccionada.id]?.length ?? 0) === 0} onClick={() => imprimirComanda(mesaSeleccionada)}>
                    Imprimir Comanda
                  </Button>
                </div>
                {mensaje && <div className="text-sm text-blue-600 mb-2">{mensaje}</div>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}





