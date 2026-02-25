import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useProductos } from "@/hooks/useProductos";
import { useSucursales } from "@/hooks/useSucursales";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Plus, Search, Package, Edit, Trash2, Menu, FolderOpen, Users, ClipboardList, Folder } from "lucide-react";
import { IngresoInventarioDialog, MenuAcciones, MenuAccionesInventario } from "@/components/productos/ProductosModals";

function formatCLP(value: number) {
  if (!value && value !== 0) return "$0";
  return `$${value.toLocaleString('es-CL')}`;
}

export default function Productos() {
    const navigate = useNavigate();
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
  const [editingProducto, setEditingProducto] = useState<any>(null);
  const [deleteProductoOpen, setDeleteProductoOpen] = useState(false);
  const [productoToDelete, setProductoToDelete] = useState<any>(null);
  const [deletingProducto, setDeletingProducto] = useState(false);
  
  // Búsqueda de categorías y proveedores
  const [categoriaSearch, setCategoriSearch] = useState("");
  const [proveedorSearch, setProveedorSearch] = useState("");
  
  // Modales para crear categoría/proveedor
  const [createCategoriaOpen, setCreateCategoriaOpen] = useState(false);
  const [createProveedorOpen, setCreateProveedorOpen] = useState(false);
  const [newCategoriaName, setNewCategoriaName] = useState("");
  const [newProveedorName, setNewProveedorName] = useState("");
  const [newProveedorRun, setNewProveedorRun] = useState("");
  const [newProveedorDv, setNewProveedorDv] = useState("");
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
  
  // Edición y eliminación de categorías
  const [editingCategoria, setEditingCategoria] = useState<any>(null);
  const [deleteCategoriaOpen, setDeleteCategoriaOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<any>(null);
  const [deletingCategoria, setDeletingCategoria] = useState(false);
  const [editCategoriaOpen, setEditCategoriaOpen] = useState(false);
  const [editCategoriaName, setEditCategoriaName] = useState("");
  const [updatingCategoria, setUpdatingCategoria] = useState(false);
  
  // Edición y eliminación de proveedores
  const [editingProveedor, setEditingProveedor] = useState<any>(null);
  const [deleteProveedorOpen, setDeleteProveedorOpen] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState<any>(null);
  const [deletingProveedor, setDeletingProveedor] = useState(false);
  const [editProveedorOpen, setEditProveedorOpen] = useState(false);
  const [editProveedorRazonSocial, setEditProveedorRazonSocial] = useState("");
  const [editProveedorRun, setEditProveedorRun] = useState("");
  const [editProveedorDv, setEditProveedorDv] = useState("");
  const [editProveedorGiro, setEditProveedorGiro] = useState("");
  const [editProveedorNumContacto, setEditProveedorNumContacto] = useState("");
  const [editProveedorDireccion, setEditProveedorDireccion] = useState("");
  const [editProveedorRegion, setEditProveedorRegion] = useState<number | null>(null);
  const [editProveedorCiudad, setEditProveedorCiudad] = useState<number | null>(null);
  const [updatingProveedor, setUpdatingProveedor] = useState(false);
  const [ciudadesEditProveedor, setCiudadesEditProveedor] = useState<any[]>([]);
  const [editProveedorCitySearch, setEditProveedorCitySearch] = useState("");
  
  // Inventario
  const [inventarioEditMode, setInventarioEditMode] = useState(false);
  const [editedInventario, setEditedInventario] = useState<{[key: string]: {stock?: string, precioCompra?: string, precioVenta?: string}}>({});
  const [inventarioPage, setInventarioPage] = useState(1);
  const [inventarioSearch, setInventarioSearch] = useState("");
  const inventarioPageSize = 15;
  const [inventarioIngresoOpen, setInventarioIngresoOpen] = useState(false);
  const [inventarioIngresoProducto, setInventarioIngresoProducto] = useState<any>(null);
  const [inventarioIngresoCantidad, setInventarioIngresoCantidad] = useState("");
  const [inventarioIngresoPrecioCompra, setInventarioIngresoPrecioCompra] = useState("");
  const [inventarioIngresoLoading, setInventarioIngresoLoading] = useState(false);
  
  const filteredCategorias = categorias.filter((c) => {
    if (!categoriaSearch) return true;
    return (c.nombre || "").toString().toLowerCase().includes(categoriaSearch.toLowerCase());
  });
  
  const filteredProveedores = proveedores.filter((p) => {
    if (!proveedorSearch) return true;
    return (p.razonsocial || "").toString().toLowerCase().includes(proveedorSearch.toLowerCase());
  });

  const getCategoriaNombre = (producto: any) => {
    const cat = categorias.find((c) => c.id === producto.categoria_id);
    return cat?.nombre || "Sin categoría";
  };
  
  const { user } = useUser();
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);
  const { productos, loading: loadingProductos } = useProductos(empresa?.id);
  const { sucursalActual } = useSucursales(empresa?.id);
  const [productosData, setProductosData] = useState<any[]>([]);

  // Sincronizar productos del hook con estado local
  useEffect(() => {
    setProductosData(productos);
  }, [productos]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filteredProducts = productosData.filter(
    (product) =>
      product.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const productsPage = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  // reset page when filter changes
  useEffect(() => { setPage(1); }, [searchTerm, productosData.length]);

  // Función para recargar productos
  const recargarProductos = async () => {
    if (!empresa?.id) return;
    try {
      const { data } = await supabase.from("Producto").select("*, Categoría(nombre)").eq("empresa", empresa.id);
      if (data) {
        const mapped = data.map((p: any) => ({
          ...p,
          categoria: p.Categoría?.nombre || "Sin categoría",
        }));
        setProductosData(mapped);
      }
    } catch (e) {
      console.warn("Error recargando productos", e);
    }
  };

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

  // Cargar ciudades cuando cambia región al editar proveedor
  useEffect(() => {
    if (!editProveedorRegion) { setCiudadesEditProveedor([]); return; }
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("ciudad").select("*").eq("region", editProveedorRegion);
        if (mounted) setCiudadesEditProveedor((data as any[]) || []);
      } catch (e) {
        console.warn("Error cargando ciudades", e);
      }
    })();
    return () => { mounted = false; };
  }, [editProveedorRegion]);

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
    setEditingProducto(null);
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
      await recargarProductos();
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
        run: newProveedorRun || null,
        dv: newProveedorDv || null,
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
      setNewProveedorRun("");
      setNewProveedorDv("");
      setNewProveedorGiro("");
      setNewProveedorNumContacto("");
      setNewProveedorDireccion("");
      setNewProveedorRegion(null);
      setNewProveedorCiudad(null);
      setProveedorCitySearch("");
      setCreateProveedorOpen(false);
      await recargarProductos();
    } catch (e) {
      console.error("Error creando proveedor", e);
    } finally {
      setCreatingProveedor(false);
    }
  };

  const editarCategoria = async () => {
    if (!editCategoriaName.trim() || !editingCategoria) return;
    setUpdatingCategoria(true);
    try {
      const { error } = await supabase
        .from("Categoría")
        .update({ nombre: editCategoriaName })
        .eq("id", editingCategoria.id);
      
      if (error) throw error;
      
      // Actualizar lista local
      const { data } = await supabase.from("Categoría").select("*").eq("empresa", empresa?.id);
      setCategorias((data as any[]) || []);
      
      setEditCategoriaOpen(false);
      setEditingCategoria(null);
      setEditCategoriaName("");
      await recargarProductos();
    } catch (e) {
      console.error("Error editando categoría", e);
    } finally {
      setUpdatingCategoria(false);
    }
  };

  const eliminarCategoria = async () => {
    if (!categoriaToDelete) return;
    setDeletingCategoria(true);
    try {
      const { error } = await supabase
        .from("Categoría")
        .delete()
        .eq("id", categoriaToDelete.id);
      
      if (error) throw error;
      
      // Actualizar lista local
      setCategorias(categorias.filter(c => c.id !== categoriaToDelete.id));
      setDeleteCategoriaOpen(false);
      setCategoriaToDelete(null);
      await recargarProductos();
    } catch (e: any) {
      console.error("Error eliminando categoría:", e);
      alert(e?.message || "Error al eliminar categoría");
    } finally {
      setDeletingCategoria(false);
    }
  };

  const editarProveedor = async () => {
    if (!editProveedorRazonSocial.trim() || !editingProveedor) return;
    setUpdatingProveedor(true);
    try {
      const { error } = await supabase
        .from("proveedores")
        .update({
          razonsocial: editProveedorRazonSocial,
          run: editProveedorRun || null,
          dv: editProveedorDv || null,
          giro: editProveedorGiro || null,
          numContacto: editProveedorNumContacto || null,
          direccion: editProveedorDireccion || null,
          ciudad: editProveedorCiudad || null,
          region: editProveedorRegion || null,
        })
        .eq("id", editingProveedor.id);
      
      if (error) throw error;
      
      // Actualizar lista local
      const { data } = await supabase.from("proveedores").select("*").eq("empresa", empresa?.id);
      setProveedores((data as any[]) || []);
      
      setEditProveedorOpen(false);
      setEditingProveedor(null);
      setEditProveedorRazonSocial("");
      setEditProveedorRun("");
      setEditProveedorDv("");
      setEditProveedorGiro("");
      setEditProveedorNumContacto("");
      setEditProveedorDireccion("");
      setEditProveedorRegion(null);
      setEditProveedorCiudad(null);
      setEditProveedorCitySearch("");
      await recargarProductos();
    } catch (e) {
      console.error("Error editando proveedor", e);
    } finally {
      setUpdatingProveedor(false);
    }
  };

  const eliminarProveedor = async () => {
    if (!proveedorToDelete) return;
    setDeletingProveedor(true);
    try {
      const { error } = await supabase
        .from("proveedores")
        .delete()
        .eq("id", proveedorToDelete.id);
      
      if (error) throw error;
      
      // Actualizar lista local
      setProveedores(proveedores.filter(p => p.id !== proveedorToDelete.id));
      setDeleteProveedorOpen(false);
      setProveedorToDelete(null);
      await recargarProductos();
    } catch (e: any) {
      console.error("Error eliminando proveedor:", e);
      alert(e?.message || "Error al eliminar proveedor");
    } finally {
      setDeletingProveedor(false);
    }
  };

  const cargarProductoParaEditar = async (producto: any) => {
    setFormNombre(producto.nombre || "");
    setFormDescripcion(producto.descripcion || "");
    setFormPrecio(producto.precio ? String(producto.precio) : "");
    setFormPrecioCompra(producto.precio_compra_coniva ? String(producto.precio_compra_coniva) : "");
    setFormStock(producto.stock ? String(producto.stock) : "");
    setFormCategoriaId(producto.categoria_id || null);
    setFormProveedorId(producto.proveedor || null);
    setFormImagenPreview(producto.imagen || null);
    setFormIndicaciones(producto.indicacionescontraindicaciones || "");
    setFormModoUso(producto.mododeuso || "");
    setFormDosificacion(producto.dosificacion || "");
    setFormAnalisis(producto.analisis || "");
    setFormIngredientes(producto.ingredientes || "");
    setFormPrecauciones(producto.precauciones || "");
    setEditingProducto(producto);
    setIsDialogOpen(true);
  };

  const editarProductoDesdeInventario = (producto: any) => {
    cargarProductoParaEditar(producto);
  };

  const eliminarProducto = async () => {
    if (!productoToDelete) return;
    setDeletingProducto(true);
    try {
      const { error } = await supabase
        .from("Producto")
        .delete()
        .eq("id", productoToDelete.id);
      
      if (error) throw error;
      
      setDeleteProductoOpen(false);
      setProductoToDelete(null);
      await recargarProductos();
    } catch (e: any) {
      console.error("Error eliminando producto:", e);
      alert(e?.message || "Error al eliminar producto");
    } finally {
      setDeletingProducto(false);
    }
  };

  const actualizarInventarioProducto = async (productoId: number) => {
    const productoIdStr = String(productoId);
    const cambios = editedInventario[productoIdStr];
    if (!cambios) return;

    try {
      const updateData: any = {};
      if (cambios.stock !== undefined) updateData.stock = Number(cambios.stock);
      if (cambios.precioCompra !== undefined) updateData.precio_compra_coniva = Number(cambios.precioCompra);
      if (cambios.precioVenta !== undefined) updateData.precio = Number(cambios.precioVenta);

      const { error } = await supabase
        .from("Producto")
        .update(updateData)
        .eq("id", productoId);

      if (error) throw error;

      // Limpiar edición
      setEditedInventario((prev) => {
        const updated = { ...prev };
        delete updated[productoIdStr];
        return updated;
      });

      await recargarProductos();
    } catch (e: any) {
      console.error("Error actualizando inventario:", e);
      alert(e?.message || "Error al actualizar inventario");
    }
  };

  const abrirIngresoInventario = (producto: any) => {
    setInventarioIngresoProducto(producto);
    setInventarioIngresoCantidad("");
    setInventarioIngresoPrecioCompra(
      producto?.precio_compra_coniva ? String(producto.precio_compra_coniva) : ""
    );
    setInventarioIngresoOpen(true);
  };

  const guardarIngresoInventario = async () => {
    if (!inventarioIngresoProducto) return;
    if (!inventarioIngresoCantidad) return;

    const cantidad = Number(inventarioIngresoCantidad);
    if (Number.isNaN(cantidad) || cantidad <= 0) return;

    setInventarioIngresoLoading(true);
    try {
      const stockActual = Number(inventarioIngresoProducto.stock || 0);
      const updateData: any = {
        stock: stockActual + cantidad,
      };

      if (inventarioIngresoPrecioCompra !== "") {
        updateData.precio_compra_coniva = Number(inventarioIngresoPrecioCompra);
      }

      const { error } = await supabase
        .from("Producto")
        .update(updateData)
        .eq("id", inventarioIngresoProducto.id);

      if (error) throw error;

      setInventarioIngresoOpen(false);
      setInventarioIngresoProducto(null);
      setInventarioIngresoCantidad("");
      setInventarioIngresoPrecioCompra("");
      await recargarProductos();
    } catch (e: any) {
      console.error("Error ingresando inventario:", e);
      alert(e?.message || "Error al ingresar inventario");
    } finally {
      setInventarioIngresoLoading(false);
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
            {/* Botón Proyectos solo para empresas 104 y 78 */}
            {empresa && (empresa.id === 104 || empresa.id === 78) && (
              <button
                onClick={() => {
                  navigate("/proyectos");
                  setSideMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted text-foreground"
              >
                <FolderOpen className="w-5 h-5" />
                <span className="font-medium">Proyectos</span>
              </button>
            )}
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
              {/* Botón Proyectos solo para empresas 104 y 78 */}
              {empresa && (empresa.id === 104 || empresa.id === 78) && (
                <button
                  onClick={() => { window.location.href = "/proyectos"; }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted text-foreground"
                >
                  <FolderOpen className="w-5 h-5" />
                  <span className="font-medium">Proyectos</span>
                </button>
              )}
            </nav>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0 space-y-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProducto ? "Editar Producto" : "Agregar Nuevo Producto"}</DialogTitle>
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
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => { setNewCategoriaName(""); setCreateCategoriaOpen(true); }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
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
                              {p.razonsocial}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => { 
                        setNewProveedorName("");
                        setNewProveedorRun("");
                        setNewProveedorDv("");
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
                  let imagenUrl = editingProducto?.imagen || null;
                  if (formImagen) {
                    setUploadingImagen(true);
                    imagenUrl = await uploadProductoImagen(formImagen);
                    setUploadingImagen(false);
                  }

                  const dataObj: any = {
                    nombre: formNombre,
                    descripcion: formDescripcion || null,
                    precio: Number(formPrecio),
                    precio_compra_coniva: formPrecioCompra ? Number(formPrecioCompra) : null,
                    stock: formStock ? Number(formStock) : 0,
                    categoria_id: formCategoriaId,
                    proveedor: formProveedorId || null,
                    imagen: imagenUrl || null,
                    activo: true,
                  };

                  if (empresa?.tipoEmpresa === "Petshop") {
                    dataObj.indicacionescontraindicaciones = formIndicaciones || null;
                    dataObj.mododeuso = formModoUso || null;
                    dataObj.dosificacion = formDosificacion || null;
                    dataObj.analisis = formAnalisis || null;
                    dataObj.ingredientes = formIngredientes || null;
                    dataObj.precauciones = formPrecauciones || null;
                  }

                  if (editingProducto) {
                    // Actualizar producto existente
                    const { error } = await supabase
                      .from("Producto")
                      .update(dataObj)
                      .eq("id", editingProducto.id);
                    
                    if (error) {
                      console.error("Error actualizando producto", error);
                      setCreateError(error.message || "Error actualizando producto");
                      return;
                    }
                  } else {
                    // Crear nuevo producto
                    dataObj.empresa = empresa?.id || null;
                    dataObj.sucursal = sucursalActual ?? null;
                    const { error } = await supabase.from("Producto").insert([dataObj]);
                    if (error) {
                      console.error("Error creando producto", error);
                      setCreateError(error.message || "Error creando producto");
                      return;
                    }
                  }

                  resetFormProducto();
                  setIsDialogOpen(false);
                  setEditingProducto(null);
                  await recargarProductos();
                } catch (e: any) {
                  console.error(e);
                  setCreateError(e?.message || "Error desconocido");
                } finally {
                  setCreatingProducto(false);
                }
              }} disabled={creatingProducto || uploadingImagen}>
                {creatingProducto ? "Guardando..." : (editingProducto ? "Actualizar Producto" : "Guardar Producto")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {selectedSection === "productos" && (
          <>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Productos</h1>
            <p className="page-subtitle mt-1">Gestiona tu catálogo de productos y servicios</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              resetFormProducto();
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
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
                      <Badge variant="secondary">{getCategoriaNombre(product)}</Badge>
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
                          {product.stock.toLocaleString('es-CL')}
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
                        <MenuAcciones 
                          product={product} 
                          onEdit={cargarProductoParaEditar}
                          onDelete={(p) => {
                            setProductoToDelete(p);
                            setDeleteProductoOpen(true);
                          }}
                        />
                      </div>
                      <div className="hidden md:flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cargarProductoParaEditar(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setProductoToDelete(product);
                            setDeleteProductoOpen(true);
                          }}
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
        </>
        )}

        {/* AlertDialog Eliminar Producto */}
        <AlertDialog open={deleteProductoOpen} onOpenChange={setDeleteProductoOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El producto "{productoToDelete?.nombre}" será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setDeleteProductoOpen(false); setProductoToDelete(null); }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={eliminarProducto} disabled={deletingProducto} className="bg-destructive hover:bg-destructive/90">
                {deletingProducto ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal Crear Categoría - Global */}
        <Dialog open={createCategoriaOpen} onOpenChange={setCreateCategoriaOpen}>
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

        {/* Modal Crear Proveedor - Global */}
        <Dialog open={createProveedorOpen} onOpenChange={setCreateProveedorOpen}>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>RUN</Label>
                  <Input 
                    type="text"
                    value={newProveedorRun} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNewProveedorRun(val);
                    }}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    placeholder="12345678"
                    inputMode="numeric"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>DV</Label>
                  <Input 
                    type="text"
                    value={newProveedorDv} 
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().slice(0, 1);
                      if (val === '' || /^[0-9K]$/.test(val)) setNewProveedorDv(val);
                    }}
                    maxLength={1}
                    placeholder="K"
                  />
                </div>
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

        {/* Sección Categorías */}
        {selectedSection === "categorias" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-header">Categorías</h1>
                <p className="page-subtitle mt-1">Gestiona las categorías de tus productos</p>
              </div>
              <Button className="gap-2" onClick={() => { setNewCategoriaName(""); setCreateCategoriaOpen(true); }}>
                <Plus className="w-4 h-4" />
                Nueva Categoría
              </Button>
            </div>

            {/* Tabla de Categorías */}
            <div className="bg-card rounded-xl border border-border overflow-x-auto animate-fade-in">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left p-4">Nombre</th>
                    <th className="text-center p-4">Productos</th>
                    <th className="text-center p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((categoria) => (
                    <tr key={categoria.id} className="table-row">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{categoria.nombre}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary">
                          {productosData.filter(p => p.categoria_id === categoria.id).length}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingCategoria(categoria);
                              setEditCategoriaName(categoria.nombre);
                              setEditCategoriaOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setCategoriaToDelete(categoria);
                              setDeleteCategoriaOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categorias.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay categorías. Crea una nueva para comenzar.
                </div>
              )}
            </div>

            {/* Modal Editar Categoría */}
            <Dialog open={editCategoriaOpen} onOpenChange={setEditCategoriaOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Editar Categoría</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Nombre</Label>
                    <Input 
                      value={editCategoriaName} 
                      onChange={(e) => setEditCategoriaName(e.target.value)}
                      placeholder="Nombre de la categoría"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setEditCategoriaOpen(false); setEditingCategoria(null); }} disabled={updatingCategoria}>
                    Cancelar
                  </Button>
                  <Button onClick={editarCategoria} disabled={updatingCategoria || !editCategoriaName.trim()}>
                    {updatingCategoria ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* AlertDialog Eliminar Categoría */}
            <AlertDialog open={deleteCategoriaOpen} onOpenChange={setDeleteCategoriaOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. La categoría "{categoriaToDelete?.nombre}" será eliminada permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setDeleteCategoriaOpen(false); setCategoriaToDelete(null); }}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={eliminarCategoria} disabled={deletingCategoria} className="bg-destructive hover:bg-destructive/90">
                    {deletingCategoria ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {/* Sección Proveedores */}
        {selectedSection === "proveedores" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-header">Proveedores</h1>
                <p className="page-subtitle mt-1">Gestiona tus proveedores y sus datos de contacto</p>
              </div>
              <Button className="gap-2" onClick={() => { 
                setNewProveedorName("");
                setNewProveedorRun("");
                setNewProveedorDv("");
                setNewProveedorGiro("");
                setNewProveedorNumContacto("");
                setNewProveedorDireccion("");
                setNewProveedorRegion(null);
                setNewProveedorCiudad(null);
                setProveedorCitySearch("");
                setCreateProveedorOpen(true); 
              }}>
                <Plus className="w-4 h-4" />
                Nuevo Proveedor
              </Button>
            </div>

            {/* Tabla de Proveedores */}
            <div className="bg-card rounded-xl border border-border overflow-x-auto animate-fade-in">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left p-4">Razón Social</th>
                    <th className="text-left p-4 hidden md:table-cell">Giro</th>
                    <th className="text-left p-4 hidden lg:table-cell">Contacto</th>
                    <th className="text-left p-4 hidden lg:table-cell">Ubicación</th>
                    <th className="text-center p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((proveedor) => {
                    const ciudadData = proveedor.ciudad ? ciudadesProveedor.find(c => c.id === proveedor.ciudad) || ciudadesEditProveedor.find(c => c.id === proveedor.ciudad) : null;
                    const regionData = proveedor.region ? regiones.find(r => r.id === proveedor.region) : null;
                    return (
                      <tr key={proveedor.id} className="table-row">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{proveedor.razonsocial}</span>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{proveedor.giro || "-"}</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">{proveedor.numContacto || "-"}</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {ciudadData?.nombre || regionData?.nombre || "-"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingProveedor(proveedor);
                                setEditProveedorRazonSocial(proveedor.razonsocial || "");
                                setEditProveedorRun(proveedor.run || "");
                                setEditProveedorDv(proveedor.dv || "");
                                setEditProveedorGiro(proveedor.giro || "");
                                setEditProveedorNumContacto(proveedor.numContacto || "");
                                setEditProveedorDireccion(proveedor.direccion || "");
                                setEditProveedorRegion(proveedor.region || null);
                                setEditProveedorCiudad(proveedor.ciudad || null);
                                setEditProveedorCitySearch("");
                                setEditProveedorOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setProveedorToDelete(proveedor);
                                setDeleteProveedorOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {proveedores.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No hay proveedores. Crea uno nuevo para comenzar.
                </div>
              )}
            </div>

            {/* Modal Editar Proveedor */}
            <Dialog open={editProveedorOpen} onOpenChange={setEditProveedorOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Proveedor</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Razón Social</Label>
                    <Input 
                      value={editProveedorRazonSocial} 
                      onChange={(e) => setEditProveedorRazonSocial(e.target.value)}
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>RUN</Label>
                      <Input 
                        type="text"
                        value={editProveedorRun} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setEditProveedorRun(val);
                        }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) e.preventDefault();
                        }}
                        placeholder="12345678"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>DV</Label>
                      <Input 
                        type="text"
                        value={editProveedorDv} 
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().slice(0, 1);
                          if (val === '' || /^[0-9K]$/.test(val)) setEditProveedorDv(val);
                        }}
                        maxLength={1}
                        placeholder="K"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Giro</Label>
                    <Input 
                      value={editProveedorGiro} 
                      onChange={(e) => setEditProveedorGiro(e.target.value)}
                      placeholder="Ej: Distribuidor, Fabricante, etc"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Teléfono/Contacto</Label>
                    <Input 
                      type="text"
                      value={editProveedorNumContacto} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
                        setEditProveedorNumContacto(val);
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
                      value={editProveedorDireccion} 
                      onChange={(e) => setEditProveedorDireccion(e.target.value)}
                      placeholder="Dirección completa"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Región</Label>
                      <Select value={editProveedorRegion ? String(editProveedorRegion) : ""} onValueChange={(v) => { setEditProveedorRegion(v ? Number(v) : null); setEditProveedorCiudad(null); }}>
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
                      <Select value={editProveedorCiudad ? String(editProveedorCiudad) : ""} onValueChange={(v) => setEditProveedorCiudad(v ? Number(v) : null)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input placeholder="Buscar ciudad..." value={editProveedorCitySearch} onChange={(e) => setEditProveedorCitySearch(e.target.value)} />
                          </div>
                          <div className="max-h-56 overflow-auto">
                            {ciudadesEditProveedor.filter((c) => {
                              if (!editProveedorCitySearch) return true;
                              return (c.nombre || "").toString().toLowerCase().includes(editProveedorCitySearch.toLowerCase());
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
                  <Button variant="outline" onClick={() => { setEditProveedorOpen(false); setEditingProveedor(null); }} disabled={updatingProveedor}>
                    Cancelar
                  </Button>
                  <Button onClick={editarProveedor} disabled={updatingProveedor || !editProveedorRazonSocial.trim()}>
                    {updatingProveedor ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* AlertDialog Eliminar Proveedor */}
            <AlertDialog open={deleteProveedorOpen} onOpenChange={setDeleteProveedorOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. El proveedor "{proveedorToDelete?.razonsocial}" será eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => { setDeleteProveedorOpen(false); setProveedorToDelete(null); }}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={eliminarProveedor} disabled={deletingProveedor} className="bg-destructive hover:bg-destructive/90">
                    {deletingProveedor ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {/* Sección Inventario */}
        {selectedSection === "inventario" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-header">Inventario</h1>
                <p className="page-subtitle mt-1">Gestiona el stock y precios de tus productos</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Modo Edición</Label>
                  <button
                    onClick={() => {
                      setInventarioEditMode(!inventarioEditMode);
                      if (inventarioEditMode) {
                        setEditedInventario({});
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      inventarioEditMode ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        inventarioEditMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={inventarioSearch}
                onChange={(e) => {
                  setInventarioSearch(e.target.value);
                  setInventarioPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Tabla de Inventario */}
            <div className="bg-card rounded-xl border border-border overflow-x-auto animate-fade-in">
              {loadingProductos ? (
                <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>
              ) : (() => {
                const filteredInventario = productosData.filter((p) =>
                  p.nombre?.toLowerCase().includes(inventarioSearch.toLowerCase()) ||
                  p.codigo?.toLowerCase().includes(inventarioSearch.toLowerCase())
                );
                const totalInventarioPages = Math.max(1, Math.ceil(filteredInventario.length / inventarioPageSize));
                const inventarioItems = filteredInventario.slice(
                  (inventarioPage - 1) * inventarioPageSize,
                  inventarioPage * inventarioPageSize
                );

                return (
                  <>
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="table-header">
                          <th className="text-left p-4">Producto</th>
                          <th className="text-left p-4 hidden md:table-cell">Categoría</th>
                          <th className="text-right p-4">Stock</th>
                          <th className="text-right p-4">Precio Compra</th>
                          <th className="text-right p-4">Precio Venta</th>
                          <th className="text-center p-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventarioItems.map((producto) => {
                          const isEditing = editedInventario[String(producto.id)];
                          const stockValue = isEditing?.stock !== undefined ? isEditing.stock : String(producto.stock || 0);
                          const precioCompraValue = isEditing?.precioCompra !== undefined ? isEditing.precioCompra : String(producto.precio_compra_coniva || 0);
                          const precioVentaValue = isEditing?.precioVenta !== undefined ? isEditing.precioVenta : String(producto.precio || 0);

                          return (
                            <tr key={producto.id} className="table-row">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{producto.nombre}</p>
                                    <p className="text-sm text-muted-foreground">{producto.codigo}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 hidden md:table-cell">
                                <Badge variant="secondary">{getCategoriaNombre(producto)}</Badge>
                              </td>
                              <td className="p-4 text-right">
                                {inventarioEditMode ? (
                                  <Input
                                    type="text"
                                    value={stockValue}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9]/g, '');
                                      setEditedInventario((prev) => ({
                                        ...prev,
                                        [String(producto.id)]: { ...prev[String(producto.id)], stock: val }
                                      }));
                                    }}
                                    onKeyDown={(e) => {
                                      if (!/[0-9]/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                                        e.preventDefault();
                                      }
                                      if (e.key === 'Enter') {
                                        actualizarInventarioProducto(producto.id);
                                      }
                                    }}
                                    className="w-24 text-right"
                                    inputMode="numeric"
                                  />
                                ) : (
                                  <span className={producto.stock < 10 ? "text-warning font-medium" : "text-foreground"}>
                                    {producto.stock.toLocaleString('es-CL')}
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                {inventarioEditMode ? (
                                  <Input
                                    type="text"
                                    value={precioCompraValue}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9.]/g, '');
                                      if (val === '' || !isNaN(parseFloat(val))) {
                                        setEditedInventario((prev) => ({
                                          ...prev,
                                          [String(producto.id)]: { ...prev[String(producto.id)], precioCompra: val }
                                        }));
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (!/[0-9.]/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                                        e.preventDefault();
                                      }
                                      if (e.key === 'Enter') {
                                        actualizarInventarioProducto(producto.id);
                                      }
                                    }}
                                    className="w-32 text-right"
                                    inputMode="decimal"
                                  />
                                ) : (
                                  <span className="text-foreground">
                                    {formatCLP(producto.precio_compra_coniva || 0)}
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                {inventarioEditMode ? (
                                  <Input
                                    type="text"
                                    value={precioVentaValue}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9.]/g, '');
                                      if (val === '' || !isNaN(parseFloat(val))) {
                                        setEditedInventario((prev) => ({
                                          ...prev,
                                          [String(producto.id)]: { ...prev[String(producto.id)], precioVenta: val }
                                        }));
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (!/[0-9.]/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                                        e.preventDefault();
                                      }
                                      if (e.key === 'Enter') {
                                        actualizarInventarioProducto(producto.id);
                                      }
                                    }}
                                    className="w-32 text-right font-semibold"
                                    inputMode="decimal"
                                  />
                                ) : (
                                  <span className="font-semibold text-foreground">
                                    {formatCLP(producto.precio || 0)}
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2 md:hidden">
                                  <MenuAccionesInventario
                                    product={producto}
                                    onEdit={editarProductoDesdeInventario}
                                    onDelete={(p) => {
                                      setProductoToDelete(p);
                                      setDeleteProductoOpen(true);
                                    }}
                                    onIngreso={abrirIngresoInventario}
                                  />
                                </div>
                                <div className="hidden md:flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => editarProductoDesdeInventario(producto)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => abrirIngresoInventario(producto)}
                                  >
                                    <ClipboardList className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setProductoToDelete(producto);
                                      setDeleteProductoOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Paginación Inventario */}
                    <div className="flex items-center justify-between p-3 border-t">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {inventarioItems.length} de {filteredInventario.length} productos
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInventarioPage((p) => Math.max(1, p - 1))}
                          disabled={inventarioPage <= 1}
                        >
                          Anterior
                        </Button>
                        <div className="text-sm">
                          {inventarioPage} / {totalInventarioPages}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInventarioPage((p) => Math.min(totalInventarioPages, p + 1))}
                          disabled={inventarioPage >= totalInventarioPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {inventarioEditMode && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Modo Edición Activo:</strong> Modifica los valores y presiona <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border rounded">Enter</kbd> para guardar los cambios.
                </p>
              </div>
            )}
          </>
        )}

        {/* Modal Ingreso Inventario */}
        <IngresoInventarioDialog
          open={inventarioIngresoOpen}
          onOpenChange={setInventarioIngresoOpen}
          producto={inventarioIngresoProducto}
          cantidad={inventarioIngresoCantidad}
          precioCompra={inventarioIngresoPrecioCompra}
          loading={inventarioIngresoLoading}
          onCantidadChange={setInventarioIngresoCantidad}
          onPrecioCompraChange={setInventarioIngresoPrecioCompra}
          onSave={guardarIngresoInventario}
          onCancel={() => {
            setInventarioIngresoOpen(false);
            setInventarioIngresoProducto(null);
            setInventarioIngresoCantidad("");
            setInventarioIngresoPrecioCompra("");
          }}
        />

      </div>
      </div>
    </AppLayout>
  );
}
