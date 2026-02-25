import { Link } from "react-router-dom";
import { Menu, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProyectos } from "@/hooks/useProyectos";
import { supabase } from "@/lib/supabaseClient";

const ProyectosList = () => {
      const [editProyecto, setEditProyecto] = useState(null);
      const [deleteProyecto, setDeleteProyecto] = useState(null);
      const [editNombre, setEditNombre] = useState("");
      const [editDescripcion, setEditDescripcion] = useState("");
      const [editCliente, setEditCliente] = useState("");
      const [editUbicacion, setEditUbicacion] = useState("");
      const [editLoading, setEditLoading] = useState(false);
      const [nuevasImagenes, setNuevasImagenes] = useState([]); // Previews locales
    const [modalProyecto, setModalProyecto] = useState(null);
    const [previewImg, setPreviewImg] = useState(null);
  const { proyectos, loading, error, refetch } = useProyectos();

  if (loading) return <div className="text-center py-8 text-muted-foreground">Cargando proyectos...</div>;
  if (error) return <div className="text-center py-8 text-destructive">Error al cargar proyectos</div>;
  if (!proyectos.length)
    return <div className="text-center py-8 text-muted-foreground">No hay proyectos para mostrar</div>;

  return (
    <>
      <div className="proyectos-list grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {proyectos.map((proyecto) => (
          <div
            key={proyecto.id}
            className="proyecto-card bg-gray-50 border border-gray-200 rounded-2xl flex flex-col overflow-hidden transition-shadow hover:shadow-md relative"
          >
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img
                src={proyecto.galeria && proyecto.galeria.length > 0 ? proyecto.galeria[0] : "/src/images/logo.png"}
                alt={proyecto.nombre || "Proyecto"}
                className="w-full h-full object-cover rounded-t-lg"
                loading="lazy"
              />
              {/* Botón de opciones */}
              <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white border border-black text-black hover:bg-gray-100"
                    >
                      <Menu className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setEditProyecto(proyecto);
                      setEditNombre(proyecto.nombre || "");
                      setEditDescripcion(proyecto.descripcion || "");
                      setEditCliente(proyecto.cliente || "");
                      setEditUbicacion(proyecto.ubicacion || "");
                    }}>
                      <Edit className="w-4 h-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteProyecto(proyecto)}>
                      <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Eliminar
                    </DropdownMenuItem>
                    {/* Opción Agregar fotos eliminada, solo editar y eliminar */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="flex flex-col items-center justify-center">
                <h3 className="font-heading text-3xl font-extrabold mb-3 text-gray-900 text-center leading-tight">
                  {proyecto.nombre || "Sin nombre"}
                </h3>
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  className="inline-block bg-primary text-white px-10 py-3 rounded-full font-body text-base font-semibold shadow hover:bg-primary/90 transition-colors"
                  onClick={() => setModalProyecto(proyecto)}
                >
                  Ver más
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal Editar/Agregar Fotos Proyecto */}
      <Dialog open={!!editProyecto} onOpenChange={() => setEditProyecto(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editProyecto?.agregarFotos ? "Agregar fotos al proyecto" : "Editar Proyecto"}
            </DialogTitle>
          </DialogHeader>
          {/* Gestión de galería en edición */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setEditLoading(true);
              const form = e.target as HTMLFormElement;
              // Quitar imágenes
              let galeriaActual = editProyecto.galeria || [];
              const quitarChecks = form.querySelectorAll('input[name="galeriaQuitar"]:checked');
              const quitarIdxs = Array.from(quitarChecks).map((input: any) => parseInt(input.value));
              let galeriaFiltrada = galeriaActual.filter((_, idx) => !quitarIdxs.includes(idx));
              // Subir nuevas imágenes a la API y obtener URLs reales
              let nuevasUrls: string[] = [];
              for (const img of nuevasImagenes) {
                if (img.file) {
                  const formData = new FormData();
                  formData.append("file", img.file, img.file.name);
                  const res = await fetch("https://pdv.restify.cl/media/subir.php", {
                    method: "POST",
                    body: formData,
                  });
                  if (!res.ok) continue;
                  const text = await res.text();
                  const urlMatch = text.match(/href='([^']+)'/);
                  if (urlMatch) nuevasUrls.push(urlMatch[1]);
                }
              }
              let galeriaFinal = [...galeriaFiltrada, ...nuevasUrls];
              const updateData: any = {
                nombre: editNombre,
                descripcion: editDescripcion,
                cliente: editCliente,
                ubicacion: editUbicacion,
                galeria: galeriaFinal,
              };
              const { error } = await supabase
                .from("proyectos")
                .update(updateData)
                .eq("id", editProyecto.id);
              setEditLoading(false);
              if (!error) {
                setEditProyecto(null);
                if (typeof refetch === "function") refetch();
              }
            }}
          >
            <Input placeholder="Nombre" value={editNombre} onChange={e => setEditNombre(e.target.value)} className="mb-2" />
            <Input placeholder="Descripción" value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} className="mb-2" />
            <Input placeholder="Cliente" value={editCliente} onChange={e => setEditCliente(e.target.value)} className="mb-2" />
            <Input placeholder="Ubicación" value={editUbicacion} onChange={e => setEditUbicacion(e.target.value)} className="mb-2" />
            {/* Galería actual */}
            {editProyecto?.galeria && editProyecto.galeria.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold mb-1">Galería actual:</div>
                <div className="flex gap-2 flex-wrap">
                  {editProyecto.galeria.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`Imagen ${idx + 1}`} className="w-20 h-20 rounded border object-cover" />
                      <label className="absolute top-0 right-0 bg-white bg-opacity-80 rounded p-1 cursor-pointer text-xs">
                        <input type="checkbox" name="galeriaQuitar" value={idx} /> Quitar
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Previews de nuevas imágenes */}
            {nuevasImagenes.length > 0 && (
              <div className="mb-2">
                <div className="font-semibold mb-1">Nuevas imágenes:</div>
                <div className="flex gap-2 flex-wrap">
                  {nuevasImagenes.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img.url} alt={`Nueva ${idx + 1}`} className="w-20 h-20 rounded border object-cover" />
                      <button type="button" className="absolute top-0 right-0 bg-white bg-opacity-80 rounded p-1 text-xs" onClick={() => setNuevasImagenes(nuevasImagenes.filter((_, i) => i !== idx))}>Quitar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Input type="file" name="fotos" multiple className="mb-2" onChange={e => {
              const files = Array.from(e.target.files || []);
              const previews = files.map(file => ({ file, url: URL.createObjectURL(file) }));
              setNuevasImagenes(prev => [...prev, ...previews]);
            }} />
            <Button type="submit" disabled={editLoading} className="w-full mt-2">Guardar</Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal Eliminar Proyecto */}
      <AlertDialog open={!!deleteProyecto} onOpenChange={() => setDeleteProyecto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proyecto "{deleteProyecto?.nombre}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProyecto(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const { error } = await supabase
                  .from("proyectos")
                  .delete()
                  .eq("id", deleteProyecto.id);
                if (!error) {
                  setDeleteProyecto(null);
                  window.location.reload();
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Modal de información y carrusel */}
      <Dialog open={!!modalProyecto} onOpenChange={() => setModalProyecto(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalProyecto?.nombre || "Sin nombre"}</DialogTitle>
          </DialogHeader>
          {/* Carrusel de imágenes */}
          {modalProyecto && (
            <div className="mb-4">
              {modalProyecto.galeria && modalProyecto.galeria.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto">
                  {modalProyecto.galeria.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Imagen ${idx + 1}`}
                      className="w-32 h-32 rounded border object-cover cursor-pointer"
                      onClick={() => setPreviewImg(img)}
                    />
                  ))}
                </div>
              ) : (
                <img src="/src/images/logo.png" alt="Logo" className="w-32 h-32 mx-auto rounded border object-cover" />
              )}
            </div>
          )}
          {/* Info del proyecto */}
          {modalProyecto && (
            <div className="space-y-2">
              <div><strong>Descripción:</strong> {modalProyecto.descripcion || "Sin descripción"}</div>
              <div><strong>Cliente:</strong> {modalProyecto.cliente || "Sin cliente"}</div>
              <div><strong>Ubicación:</strong> {modalProyecto.ubicacion || "Sin ubicación"}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de previsualización de imagen */}
      <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
        <DialogContent className="max-w-2xl flex flex-col items-center justify-center">
          <img src={previewImg || ""} alt="Previsualización" className="w-[700px] max-w-full h-auto rounded shadow-lg mx-auto" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProyectosList;
