import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useProductos } from "@/hooks/useProductos";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Package, Edit, Trash2, MoreHorizontal, Menu, FolderOpen, Users, ClipboardList } from "lucide-react";

function formatCLP(value: number) {
  return value?.toLocaleString('es-CL');
}

export default function Productos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState("productos");
  
  // Form state
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPrecio, setFormPrecio] = useState("");
  const [formPrecioCompra, setFormPrecioCompra] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategoriaId, setFormCategoriaId] = useState<number | null>(null);
  const [formProveedorId, setFormProveedorId] = useState<number | null>(null);
  const [formImagen, setFormImagen] = useState<File | null>(null);
  const [formImagenPreview, setFormImagenPreview] = useState<string | null>(null);
  const [uploadingImagen, setUploadingImagen] = useState(false);
  
  // Campos Petshop
  const [formIndicaciones, setFormIndicaciones] = useState("");
  const [formModoUso, setFormModoUso] = useState("");
  const [formDosificacion, setFormDosificacion] = useState("");
  const [formAnalisis, setFormAnalisis] = useState("");
  const [formIngredientes, setFormIngredientes] = useState("");
  const [formPrecauciones, setFormPrecauciones] = useState("");
  
  const [categorias, setCategorias] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [creatingProducto, setCreatingProducto] = useState(false);
  const [createError, setCreateError] = useState("");
  
  // Búsqueda de categorías y proveedores
  const [categoriaSearch, setCategoriSearch] = useState("");
  const [proveedorSearch, setProveedorSearch] = useState("");
  
  // Modales para crear categoría/proveedor
  const [createCategoriaOpen, setCreateCategoriaOpen] = useState(false);
  const [createProveedorOpen, setCreateProveedorOpen] = useState(false);
  const [newCategoriaName, setNewCategoriaName] = useState("");
  const [newProveedorName, setNewProveedorName] = useState("");
  const [newProveedorGiro, setNewProveedorGiro] = useState("");
  const [newProveedorNumContacto, setNewProveedorNumContacto] = useState("");
  const [newProveedorDireccion, setNewProveedorDireccion] = useState("");
  const [newProveedorRegion, setNewProveedorRegion] = useState<number | null>(null);
  const [newProveedorCiudad, setNewProveedorCiudad] = useState<number | null>(null);
  const [creatingCategoria, setCreatingCategoria] = useState(false);
  const [creatingProveedor, setCreatingProveedor] = useState(false);
  const [regiones, setRegiones] = useState<any[]>([]);
  const [ciudadesProveedor, setCiudadesProveedor] = useState<any[]>([]);
  const [proveedorCitySearch, setProveedorCitySearch] = useState("");
  
  const filteredCategorias = categorias.filter((c) => {
    if (!categoriaSearch) return true;
    return (c.nombre || "").toString().toLowerCase().includes(categoriaSearch.toLowerCase());
  });
  
  const filteredProveedores = proveedores.filter((p) => {
    if (!proveedorSearch) return true;
    return (p.nombre || "").toString().toLowerCase().includes(proveedorSearch.toLowerCase());
  });
  
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

  // Cargar categorías
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("Categoría").select("*").eq("empresa", empresa?.id);
        if (mounted) setCategorias((data as any[]) || []);
      } catch (e) {
        console.warn("Error cargando categorías", e);
      }
    })();
    return () => { mounted = false; };
  }, [empresa?.id]);

  // Cargar proveedores
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("proveedores").select("*").eq("empresa", empresa?.id);
        if (mounted) setProveedores((data as any[]) || []);
      } catch (e) {
        console.warn("Error cargando proveedores", e);
      }
    })();
    return () => { mounted = false; };
  }, [empresa?.id]);

  // Cargar regiones
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("region").select("*");
        if (mounted) setRegiones((data as any[]) || []);
      } catch (e) {
        console.warn("Error cargando regiones", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Cargar ciudades cuando cambia región del proveedor
  useEffect(() => {
    if (!newProveedorRegion) { setCiudadesProveedor([]); return; }
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("ciudad").select("*").eq("region", newProveedorRegion);
        if (mounted) setCiudadesProveedor((data as any[]) || []);
      } catch (e) {
        console.warn("Error cargando ciudades", e);
      }
    })();
    return () => { mounted = false; };
  }, [newProveedorRegion]);

  const resetFormProducto = () => {
    setFormNombre("");
    setFormDescripcion("");
    setFormPrecio("");
    setFormPrecioCompra("");
    setFormStock("");
    setFormCategoriaId(null);
    setFormProveedorId(null);
    setFormImagen(null);
    setFormImagenPreview(null);
    setFormIndicaciones("");
    setFormModoUso("");
    setFormDosificacion("");
    setFormAnalisis("");
    setFormIngredientes("");
    setFormPrecauciones("");
    setCreateError("");
    setCategoriSearch("");
    setProveedorSearch("");
  };

  const uploadProductoImagen = async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file, file.name);

      const res = await fetch("https://pdv.restify.cl/media/subir.php", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        throw new Error("Error subiendo imagen");
      }

      const text = await res.text();
      const urlMatch = text.match(/href='([^']+)'/);
      return urlMatch ? urlMatch[1] : null;
    } catch (e) {
      console.error("Error al subir imagen:", e);
      return null;
    }
  };

  const crearCategoria = async () => {
    if (!newCategoriaName.trim()) return;
    setCreatingCategoria(true);
    try {
      const { data, error } = await supabase.from("Categoría").insert([{
        nombre: newCategoriaName,
        empresa: empresa?.id,
      }]).select();
      
      if (error) throw error;
      setCategorias([...categorias, data[0]]);
      setFormCategoriaId(data[0].id);
      setNewCategoriaName("");
      setCreateCategoriaOpen(false);
    } catch (e) {
      console.error("Error creando categoría", e);
    } finally {
      setCreatingCategoria(false);
    }
  };

  const crearProveedor = async () => {
    if (!newProveedorName.trim()) return;
    setCreatingProveedor(true);
    try {
      const { data, error } = await supabase.from("proveedores").insert([{
        razonsocial: newProveedorName,
        giro: newProveedorGiro || null,
        numContacto: newProveedorNumContacto || null,
        direccion: newProveedorDireccion || null,
        ciudad: newProveedorCiudad || null,
        region: newProveedorRegion || null,
        pais: "Chile",
        empresa: empresa?.id,
      }]).select();
      
      if (error) throw error;
      setProveedores([...proveedores, data[0]]);
      setFormProveedorId(data[0].id);
      setNewProveedorName("");
      setNewProveedorGiro("");
      setNewProveedorNumContacto("");
      setNewProveedorDireccion("");
      setNewProveedorRegion(null);
      setNewProveedorCiudad(null);
      setProveedorCitySearch("");
      setCreateProveedorOpen(false);
    } catch (e) {
      console.error("Error creando proveedor", e);
    } finally {
      setCreatingProveedor(false);
    }
  };

  

  return (
    <AppLayout>
      {/* Botón flotante para abrir menú lateral en móvil */}
      <Sheet open={sideMenuOpen} onOpenChange={setSideMenuOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="fixed left-4 bottom-4 z-40 md:hidden shadow-lg rounded-full w-14 h-14"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4">
            <button
              onClick={() => { setSelectedSection("productos"); setSideMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                selectedSection === "productos"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Productos</span>
            </button>
            <button
              onClick={() => { setSelectedSection("categorias"); setSideMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                selectedSection === "categorias"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="font-medium">Categorías</span>
            </button>
            <button
              onClick={() => { setSelectedSection("proveedores"); setSideMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                selectedSection === "proveedores"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Proveedores</span>
            </button>
            <button
              onClick={() => { setSelectedSection("inventario"); setSideMenuOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                selectedSection === "inventario"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Inventario</span>
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex gap-6">
        {/* Menú lateral para desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-[65px]">
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedSection("productos")}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedSection === "productos"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <Package className="w-5 h-5" />
                <span className="font-medium">Productos</span>
              </button>
              <button
                onClick={() => setSelectedSection("categorias")}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedSection === "categorias"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <FolderOpen className="w-5 h-5" />
                <span className="font-medium">Categorías</span>
              </button>
              <button
                onClick={() => setSelectedSection("proveedores")}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedSection === "proveedores"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Proveedores</span>
              </button>
              <button
                onClick={() => setSelectedSection("inventario")}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedSection === "inventario"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span className="font-medium">Inventario</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Productos</h1>
            <p className="page-subtitle mt-1">Gestiona tu catálogo de productos y servicios</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetFormProducto}>
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Campos básicos */}
                <div className="grid gap-2">
                  <Label>Nombre del Producto</Label>
                  <Input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Nombre" />
                </div>
                
                <div className="grid gap-2">
                  <Label>Descripción</Label>
                  <Input value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} placeholder="Descripción" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Precio de Venta</Label>
                    <Input 
                      type="text" 
                      value={formPrecio} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        if (val === '' || !isNaN(parseFloat(val))) setFormPrecio(val);
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) e.preventDefault();
                      }}
                      placeholder="$0" 
                      inputMode="decimal" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Precio Compra c/IVA</Label>
                    <Input 
                      type="text" 
                      value={formPrecioCompra} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        if (val === '' || !isNaN(parseFloat(val))) setFormPrecioCompra(val);
                      }}
                      onKeyPress={(e) => {
                        if (!/[0-9.]/.test(e.key)) e.preventDefault();
                      }}
                      placeholder="$0" 
                      inputMode="decimal" 
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Stock</Label>
                  <Input 
                    type="text" 
                    value={formStock} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val === '' || !isNaN(parseInt(val))) setFormStock(val);
                    }}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    placeholder="0" 
                    inputMode="numeric" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Categoría</Label>
                    <div className="flex gap-2">
                      <Select value={formCategoriaId ? String(formCategoriaId) : ""} onValueChange={(v) => setFormCategoriaId(v ? Number(v) : null)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input 
                              placeholder="Buscar categoría..." 
                              value={categoriaSearch} 
                              onChange={(e) => setCategoriSearch(e.target.value)} 
                            />
                          </div>
                          <div className="max-h-56 overflow-auto">
                            {filteredCategorias.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                      <Dialog open={createCategoriaOpen} onOpenChange={setCreateCategoriaOpen}>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => { setNewCategoriaName(""); setCreateCategoriaOpen(true); }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <DialogContent className="sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle>Nueva Categoría</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label>Nombre</Label>
                              <Input 
                                value={newCategoriaName} 
                                onChange={(e) => setNewCategoriaName(e.target.value)}
                                placeholder="Ej: Electrónica, Ropa, etc"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setCreateCategoriaOpen(false)} disabled={creatingCategoria}>
                              Cancelar
                            </Button>
                            <Button onClick={crearCategoria} disabled={creatingCategoria || !newCategoriaName.trim()}>
                              {creatingCategoria ? "Creando..." : "Crear"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Proveedor</Label>
                    <div className="flex gap-2">
                      <Select value={formProveedorId ? String(formProveedorId) : ""} onValueChange={(v) => setFormProveedorId(v ? Number(v) : null)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input 
                              placeholder="Buscar proveedor..." 
                              value={proveedorSearch} 
                              onChange={(e) => setProveedorSearch(e.target.value)} 
                            />
                          </div>
                          <div className="max-h-56 overflow-auto">
                            {filteredProveedores.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.nombre}
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                      <Dialog open={createProveedorOpen} onOpenChange={setCreateProveedorOpen}>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => { 
                            setNewProveedorName("");
                            setNewProveedorGiro("");
                            setNewProveedorNumContacto("");
                            setNewProveedorDireccion("");
                            setNewProveedorRegion(null);
                            setNewProveedorCiudad(null);
                            setProveedorCitySearch("");
                            setCreateProveedorOpen(true); 
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Nuevo Proveedor</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label>Razón Social</Label>
                              <Input 
                                value={newProveedorName} 
                                onChange={(e) => setNewProveedorName(e.target.value)}
                                placeholder="Nombre del proveedor"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Giro</Label>
                              <Input 
                                value={newProveedorGiro} 
                                onChange={(e) => setNewProveedorGiro(e.target.value)}
                                placeholder="Ej: Distribuidor, Fabricante, etc"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Teléfono/Contacto</Label>
                              <Input 
                                type="text"
                                value={newProveedorNumContacto} 
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                                  setNewProveedorNumContacto(val);
                                }}
                                onKeyPress={(e) => {
                                  if (!/[0-9]/.test(e.key)) e.preventDefault();
                                }}
                                maxLength={9}
                                placeholder="912345678"
                                inputMode="numeric"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Dirección</Label>
                              <Input 
                                value={newProveedorDireccion} 
                                onChange={(e) => setNewProveedorDireccion(e.target.value)}
                                placeholder="Dirección completa"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Región</Label>
                                <Select value={newProveedorRegion ? String(newProveedorRegion) : ""} onValueChange={(v) => { setNewProveedorRegion(v ? Number(v) : null); setNewProveedorCiudad(null); }}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar región" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {regiones.map((r) => (
                                      <SelectItem key={r.id} value={String(r.id)}>
                                        {r.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label>Ciudad</Label>
                                <Select value={newProveedorCiudad ? String(newProveedorCiudad) : ""} onValueChange={(v) => setNewProveedorCiudad(v ? Number(v) : null)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar ciudad" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <div className="p-2">
                                      <Input placeholder="Buscar ciudad..." value={proveedorCitySearch} onChange={(e) => setProveedorCitySearch(e.target.value)} />
                                    </div>
                                    <div className="max-h-56 overflow-auto">
                                      {ciudadesProveedor.filter((c) => {
                                        if (!proveedorCitySearch) return true;
                                        return (c.nombre || "").toString().toLowerCase().includes(proveedorCitySearch.toLowerCase());
                                      }).map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                          {c.nombre}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setCreateProveedorOpen(false)} disabled={creatingProveedor}>
                              Cancelar
                            </Button>
                            <Button onClick={crearProveedor} disabled={creatingProveedor || !newProveedorName.trim()}>
                              {creatingProveedor ? "Creando..." : "Crear"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>

                {/* Imagen */}
                <div className="grid gap-2">
                  <Label>Imagen del Producto</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {formImagenPreview ? (
                      <div className="w-24 h-24 mx-auto rounded-lg bg-white flex items-center justify-center overflow-hidden border">
                        <img src={formImagenPreview} alt="Preview" className="max-w-full max-h-full" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 mx-auto rounded-lg bg-muted flex items-center justify-center mb-2">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formImagen ? formImagen.name : "Selecciona una imagen PNG o JPG"}
                    </p>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormImagen(file);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFormImagenPreview(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="imagen-input"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("imagen-input")?.click()}
                      className="mt-2"
                    >
                      Seleccionar Imagen
                    </Button>
                  </div>
                </div>

                {/* Campos Petshop */}
                {empresa?.tipoEmpresa === "Petshop" && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold text-sm mb-4">Información Petshop</h3>
                    </div>
                    <div className="grid gap-2">
                      <Label>Indicaciones/Contraindicaciones</Label>
                      <Input value={formIndicaciones} onChange={(e) => setFormIndicaciones(e.target.value)} placeholder="Indicaciones" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Modo de Uso</Label>
                      <Input value={formModoUso} onChange={(e) => setFormModoUso(e.target.value)} placeholder="Modo de uso" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Dosificación</Label>
                      <Input value={formDosificacion} onChange={(e) => setFormDosificacion(e.target.value)} placeholder="Dosificación" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Análisis</Label>
                      <Input value={formAnalisis} onChange={(e) => setFormAnalisis(e.target.value)} placeholder="Análisis" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Ingredientes</Label>
                      <Input value={formIngredientes} onChange={(e) => setFormIngredientes(e.target.value)} placeholder="Ingredientes" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Precauciones</Label>
                      <Input value={formPrecauciones} onChange={(e) => setFormPrecauciones(e.target.value)} placeholder="Precauciones" />
                    </div>
                  </>
                )}

                {createError && <div className="text-sm text-destructive">{createError}</div>}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetFormProducto(); }} disabled={creatingProducto}>
                  Cancelar
                </Button>
                <Button onClick={async () => {
                  setCreateError("");
                  if (!formNombre) { setCreateError("Nombre es requerido"); return; }
                  if (!formPrecio) { setCreateError("Precio es requerido"); return; }
                  if (!formStock) { setCreateError("Stock es requerido"); return; }
                  if (!formCategoriaId) { setCreateError("Categoría es requerida"); return; }
                  
                  setCreatingProducto(true);
                  try {
                    let imagenUrl = null;
                    if (formImagen) {
                      setUploadingImagen(true);
                      imagenUrl = await uploadProductoImagen(formImagen);
                      setUploadingImagen(false);
                    }

                    const insertObj: any = {
                      nombre: formNombre,
                      descripcion: formDescripcion || null,
                      precio: Number(formPrecio),
                      precio_compra_coniva: formPrecioCompra ? Number(formPrecioCompra) : null,
                      stock: formStock ? Number(formStock) : 0,
                      categoria_id: formCategoriaId,
                      proveedor_id: formProveedorId || null,
                      imagen: imagenUrl || null,
                      empresa: empresa?.id || null,
                      activo: true,
                    };

                    if (empresa?.tipoEmpresa === "Petshop") {
                      insertObj.indicacionescontraindicaciones = formIndicaciones || null;
                      insertObj.mododeuso = formModoUso || null;
                      insertObj.dosificacion = formDosificacion || null;
                      insertObj.analisis = formAnalisis || null;
                      insertObj.ingredientes = formIngredientes || null;
                      insertObj.precauciones = formPrecauciones || null;
                    }

                    const { error } = await supabase.from("productos").insert([insertObj]);
                    if (error) {
                      console.error("Error creando producto", error);
                      setCreateError(error.message || "Error creando producto");
                      return;
                    }

                    resetFormProducto();
                    setIsDialogOpen(false);
                  } catch (e: any) {
                    console.error(e);
                    setCreateError(e?.message || "Error desconocido");
                  } finally {
                    setCreatingProducto(false);
                  }
                }} disabled={creatingProducto || uploadingImagen}>
                  {creatingProducto ? "Guardando..." : "Guardar Producto"}
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
