import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, FileText, Download, Eye, ChevronDown, ChevronUp, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

// Carpeta y archivo tipos simples (los campos reales vienen de la BD)
type Carpeta = any;
type Archivo = any;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};

export default function Documentos() {
  const { user } = useUser();
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);

  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [loadingCarpetas, setLoadingCarpetas] = useState(false);
  const [selectedCarpeta, setSelectedCarpeta] = useState<Carpeta | null>(null);

  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newFecha, setNewFecha] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // Carpetas UI: search, create and expand
  const [folderSearch, setFolderSearch] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolders, setShowFolders] = useState(true);

  // Pagination for archivos table
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!empresa?.id) return;
    setLoadingCarpetas(true);
    supabase
      .from("carpetas")
      .select("*")
      .eq("empresa", empresa.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setLoadingCarpetas(false);
        if (error) {
          console.error("Error cargando carpetas:", error);
          setCarpetas([]);
        } else {
          setCarpetas((data as Carpeta[]) || []);
        }
      });
  }, [empresa?.id]);

  // Intenta cargar archivos para la carpeta seleccionada.
  // Se prueban varias columnas comunes como "carpeta" o "carpeta_id".
  async function loadArchivosFor(carpeta: Carpeta | null) {
    setArchivos([]);
    if (!carpeta) return;
    setLoadingArchivos(true);
    const carpetaKey = carpeta.tablaID ?? carpeta.id ?? carpeta.TablaID ?? carpeta.Tablaid;
    const tryCols = ["carpeta", "carpeta_id", "carpeta_tablaid", "carpeta_tablaID", "carpetaid"];
    let success = false;
    for (const col of tryCols) {
      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await supabase
        .from("archivos_carpeta")
        .select("*, nombre_archivo, fecha_documento, url_archivo")
        .eq(col, carpetaKey as any)
        .order("fecha_documento", { ascending: false });
      if (!error) {
        setArchivos((data as Archivo[]) || []);
        success = true;
        break;
      }
    }
    if (!success) {
      // último intento: obtener todos y filtrar por la columna de carpeta (id) o por nombre de carpeta
      const { data, error } = await supabase
        .from("archivos_carpeta")
        .select("*, nombre_archivo, fecha_documento, url_archivo")
        .order("fecha_documento", { ascending: false });
      if (!error) {
        const arr = (data as Archivo[]) || [];
        const filtered = arr.filter((a) => {
          const possibleIds = [a.carpeta, a.carpeta_id, a.carpeta_uuid, a.carpeta_tablaid, a.carpeta_tablaID, a.carpetaid];
          // match exact carpeta id if present on row
          if (possibleIds.some((v) => v != null && String(v) === String(carpetaKey))) return true;
          // fallback: try match by nombre de carpeta appearing in nombre_archivo
          const name = (a.nombre_archivo || a.carpeta_nombre || a.folder_name || "").toString().toLowerCase();
          return name && carpeta.nombre && name.includes(carpeta.nombre.toLowerCase());
        });
        setArchivos(filtered);
      } else {
        console.error("Error cargando archivos_carpeta:", error);
        setArchivos([]);
      }
    }
    setLoadingArchivos(false);
  }

  useEffect(() => {
    loadArchivosFor(selectedCarpeta);
  }, [selectedCarpeta]);

  const archivosFiltrados = archivos.filter((a) => {
    if (!searchTerm) return true;
    const name = (a.nombre || a.filename || a.nombre_archivo || "").toString().toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // pagination logic
  useEffect(() => { setPage(1); }, [selectedCarpeta, archivos.length]);
  const totalPages = Math.max(1, Math.ceil(archivosFiltrados.length / pageSize));
  const archivosPage = archivosFiltrados.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Documentos</h1>
            <p className="page-subtitle mt-1">Archivos organizados por carpetas</p>

            {/* Crear carpeta dialog */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Crear Carpeta</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Nombre</Label>
                    <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nombre de la carpeta" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancelar</Button>
                  <Button onClick={async () => {
                    if (!newFolderName) return;
                    const insertObj: any = { nombre: newFolderName, empresa: empresa?.id || null };
                    const { error } = await supabase.from('carpetas').insert([insertObj]);
                    if (error) {
                      console.error('Error creando carpeta', error);
                    } else {
                      setNewFolderName('');
                      setIsCreateFolderOpen(false);
                      // reload carpetas
                      const { data } = await supabase.from('carpetas').select('*').eq('empresa', empresa?.id).order('created_at', { ascending: false });
                      setCarpetas((data as Carpeta[]) || []);
                    }
                  }}>Crear Carpeta</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Agregar Archivo</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Nombre archivo</Label>
                    <Input value={newNombre} onChange={(e) => setNewNombre(e.target.value)} placeholder="Nombre visible" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descripción</Label>
                    <Input value={newDescripcion} onChange={(e) => setNewDescripcion(e.target.value)} placeholder="Descripción opcional" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fecha del documento</Label>
                    <Input type="date" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Archivo (jpg, png, pdf)</Label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setNewFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    />
                  </div>
                  {uploadError && <div className="text-sm text-destructive">{uploadError}</div>}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={uploading}>Cancelar</Button>
                  <Button onClick={async () => {
                    setUploadError("");
                    if (!selectedCarpeta) { setUploadError('Selecciona una carpeta antes de subir'); return; }
                    if (!newFile) { setUploadError('Selecciona un archivo'); return; }
                    setUploading(true);
                    try {
                      const carpetaKey = selectedCarpeta.tablaID ?? selectedCarpeta.id;
                      // Upload using external endpoints depending on file type
                      const isPdf = newFile.type === 'application/pdf' || (newFile.name || '').toLowerCase().endsWith('.pdf');
                      const uploadEndpoint = isPdf ? 'https://pdv.restify.cl/media/subirpdf.php' : 'https://pdv.restify.cl/media/subir.php';
                      const form = new FormData();
                      form.append('file', newFile as File);
                      // optional metadata
                      form.append('empresa', String(empresa?.id || ''));
                      form.append('carpeta', String(carpetaKey));

                      const resp = await fetch(uploadEndpoint, {
                        method: 'POST',
                        body: form,
                      });
                      if (!resp.ok) {
                        const text = await resp.text();
                        console.error('Upload endpoint error', resp.status, text);
                        setUploadError(`Error subiendo archivo: ${resp.status}`);
                        setUploading(false);
                        return;
                      }
                      const json = await resp.json().catch(() => null) as any;
                      const publicUrl = json?.url || json?.data?.url || '';
                      if (!publicUrl) {
                        console.error('Upload endpoint did not return url', json);
                        setUploadError('No se recibió URL del servidor de subida');
                        setUploading(false);
                        return;
                      }

                      // Insert metadata: use `carpeta` column (id) in archivos_carpeta
                      const insertObj: any = {
                        nombre_archivo: newNombre || newFile.name,
                        descripcion: newDescripcion || null,
                        fecha_documento: newFecha || null,
                        url_archivo: publicUrl,
                        carpeta: carpetaKey,
                        created_at: new Date().toISOString(),
                      };

                      let { error: insErr } = await supabase.from('archivos_carpeta').insert([insertObj]);
                      if (insErr) {
                        // handle Postgres array column mismatch (malformed array literal)
                        const msg = (insErr && insErr.message) || '';
                        if (/malformed array literal/i.test(msg)) {
                          try {
                            // retry with url_archivo as array
                            const retryObj = { ...insertObj, url_archivo: [insertObj.url_archivo] };
                            const { error: retryErr } = await supabase.from('archivos_carpeta').insert([retryObj]);
                            if (retryErr) {
                              console.error('Retry insert error', retryErr);
                              setUploadError(retryErr.message || 'Error guardando metadata');
                              setUploading(false);
                              return;
                            }
                          } catch (e: any) {
                            console.error('Retry exception', e);
                            setUploadError(e?.message || 'Error guardando metadata (retry)');
                            setUploading(false);
                            return;
                          }
                        } else {
                          console.error('Insert error', insErr);
                          setUploadError(insErr.message || 'Error guardando metadata');
                          setUploading(false);
                          return;
                        }
                      }
                      // Success: reload archivos
                      await loadArchivosFor(selectedCarpeta);
                      setIsCreateOpen(false);
                      // reset
                      setNewNombre(''); setNewDescripcion(''); setNewFecha(''); setNewFile(null);
                    } catch (err: any) {
                      console.error(err);
                      setUploadError(err?.message || 'Error desconocido');
                    } finally {
                      setUploading(false);
                    }
                  }} disabled={uploading}>
                    {uploading ? 'Subiendo...' : 'Subir Archivo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Carpetas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Carpetas</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Buscar carpetas..."
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsCreateFolderOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Carpeta
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowFolders((s) => !s)}>
                {showFolders ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          {loadingCarpetas ? (
            <div className="text-muted-foreground">Cargando carpetas...</div>
          ) : carpetas.length === 0 ? (
            <div className="text-muted-foreground">No hay carpetas</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {showFolders && carpetas
                .filter((c) => {
                  if (!folderSearch) return true;
                  return (c.nombre || '').toString().toLowerCase().includes(folderSearch.toLowerCase());
                })
                .map((c) => {
                  const key = (c.tablaID ?? c.id ?? '').toString();
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedCarpeta(c)}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer hover:shadow-card-hover transition",
                        selectedCarpeta && (selectedCarpeta.tablaID ?? selectedCarpeta.id) === (c.tablaID ?? c.id)
                          ? "border-primary bg-primary/5"
                          : "bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Folder className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{c.nombre || c.title || "Carpeta"}</h3>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{c.count || ''}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Archivos de la carpeta seleccionada */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{selectedCarpeta ? (selectedCarpeta.nombre || 'Archivos') : 'Selecciona una carpeta'}</h2>
            <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Buscar archivos..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  />
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2" disabled={!selectedCarpeta}>
                  <Plus className="w-4 h-4" />
                  Nuevo Archivo
                </Button>
              </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-x-auto animate-fade-in">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-4">Nombre</th>
                  <th className="text-left p-4">Fecha</th>
                  <th className="text-center p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingArchivos ? (
                  <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Cargando archivos...</td></tr>
                ) : archivosFiltrados.length === 0 ? (
                  <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No hay archivos</td></tr>
                ) : (
                  archivosPage.map((a) => (
                    <tr key={a.tablaID ?? a.id ?? a.url_archivo} className="table-row">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              <a href={a.url_archivo} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                                {a.nombre_archivo || a.nombre || a.filename || a.title}
                              </a>
                            </p>
                            <p className="text-sm text-muted-foreground">{a.descripcion || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{a.fecha_documento ? new Date(a.fecha_documento).toLocaleString() : (a.created_at ? new Date(a.created_at).toLocaleString() : '')}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={a.url_archivo} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={a.url_archivo} download>
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex items-center justify-between p-3">
              <div className="text-sm text-muted-foreground">Mostrando {(archivosPage.length)} de {archivosFiltrados.length} archivos</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
                <div className="text-sm">{page} / {totalPages}</div>
                <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Siguiente</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
