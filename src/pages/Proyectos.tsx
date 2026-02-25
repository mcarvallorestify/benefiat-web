import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import ProyectosList from "@/components/ProyectosList";

// ...existing code...

function Proyectos() {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cliente, setCliente] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [galeria, setGaleria] = useState<string>("");
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [imagenesPreview, setImagenesPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

    // Control de acceso por empresa
    if (empresa?.id !== 104 && empresa?.id !== 78) {
      return (
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <h2 className="text-2xl font-bold mb-4">Acceso restringido</h2>
            <p className="text-muted-foreground">Solo las empresas 104 y 78 pueden acceder a Proyectos.</p>
          </div>
        </AppLayout>
      );
    }

  // Recarga de proyectos: se delega al hook en ProyectosList

  const handleCrearProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let galeriaArr: string[] = [];
    if (imagenes.length > 0) {
      setUploading(true);
      for (const file of imagenes) {
        const form = new FormData();
        form.append("file", file, file.name);
        const res = await fetch("https://pdv.restify.cl/media/subir.php", {
          method: "POST",
          body: form,
        });
        if (!res.ok) continue;
        const text = await res.text();
        const urlMatch = text.match(/href='([^']+)'/);
        if (urlMatch) galeriaArr.push(urlMatch[1]);
      }
      setUploading(false);
    } else {
      galeriaArr = galeria
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g);
    }
    const { error } = await supabase.from("proyectos").insert([
      {
        empresa: empresa?.id,
        nombre,
        descripcion,
        cliente,
        ubicacion,
        galeria: galeriaArr,
      },
    ]);
    setLoading(false);
    if (!error) {
      setModalOpen(false);
      setNombre("");
      setDescripcion("");
      setCliente("");
      setUbicacion("");
      setGaleria("");
      setImagenes([]);
      setImagenesPreview([]);
      // El hook useProyectos se encarga de recargar
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="mb-8">
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="mb-4">Crear Proyecto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Proyecto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrearProyecto}>
                <Input
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Ubicación"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="mb-2"
                />
                <div className="mb-2">
                  <label className="block mb-1 font-medium">Imágenes del proyecto</label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setImagenes(prev => [...prev, ...files]);
                      setImagenesPreview(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
                    }}
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {imagenesPreview.map((src, idx) => (
                      <img key={idx} src={src} alt="Preview" className="w-12 h-12 rounded border object-cover" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Puedes subir varias imágenes PNG o JPG.</p>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  Guardar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {/* Lista de proyectos estilo cards */}
        {empresa?.id && (empresa.id === 104 || empresa.id === 78) && (
          <ProyectosList />
        )}
      </div>
    </AppLayout>
  );
}

export default Proyectos;
