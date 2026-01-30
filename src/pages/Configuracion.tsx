import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Phone, MapPin, FileText, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/lib/supabaseClient";

export default function Configuracion() {
  const { user } = useUser();
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);

  // form state
  const [rutEmpresa, setRutEmpresa] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [nombreEmpresa, setnombreEmpresa] = useState("");
  const [giro, setGiro] = useState("");

  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState<number | null>(null);
  const [region, setRegion] = useState<number | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [citySearch, setCitySearch] = useState("");

  const [correoEmpresa, setEmail] = useState("");
  const [numEmpresa, setTelefono] = useState("");

  // SII / facturación
  const [siiId, setSiiId] = useState<number | null>(null);
  const [siiNumero, setSiiNumero] = useState("");
  const [siiFecha, setSiiFecha] = useState<string | null>(null);
  const [siiActeco, setSiiActeco] = useState<number | null>(null);
  const [siiFolioBoletas, setSiiFolioBoletas] = useState<number | null>(null);
  const [siiFolioFacturas, setSiiFolioFacturas] = useState<number | null>(null);
  const [siiCertificado, setSiiCertificado] = useState("");
  const [siiCAF, setSiiCAF] = useState("");
  // certificado upload + clave
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);
  // CAF upload
  const [selectedCafFile, setSelectedCafFile] = useState<File | null>(null);
  const [uploadingCaf, setUploadingCaf] = useState(false);
  const [siiFolioSiguiente, setSiiFolioSiguiente] = useState<number | null>(null);
  // Logo upload
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // Portada upload
  const [selectedPortadaFile, setSelectedPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
  const [uploadingPortada, setUploadingPortada] = useState(false);

  useEffect(() => {
    if (!empresa) return;
    // map known fields from empresa object if present
    setRutEmpresa(empresa.rutEmpresa ?? empresa.rut ?? "");
    setRazonSocial(empresa.razonSocialEmpresa ?? empresa.raz_social ?? "");
    setnombreEmpresa(empresa.nombreEmpresa  ?? "");
    setGiro(empresa.giroEmpresa ?? empresa.giro ?? "");

    setDireccion(empresa.direccionEmpresa ?? empresa.direccion ?? "");
    // empresa.ciudadEmpresa / regionEmpresa might be stored as id
    const regId = empresa.regionEmpresa ?? empresa.region ?? null;
    setRegion(regId ? Number(regId) : null);
    const ciudadId =  empresa.ciudad ?? empresa.comunaEmpresa ?? null;
    setCiudad(ciudadId ? Number(ciudadId) : null);

    setEmail(empresa.correoEmpresa ?? "");
    setTelefono(empresa.numEmpresa ?? "");
    
    // Cargar logo si existe
    if (empresa.logo) {
      setLogoPreview(empresa.logo);
    }
    
    // Cargar portada si existe
    if (empresa.imgEmpresa) {
      setPortadaPreview(empresa.imgEmpresa);
    }
  }, [empresa]);

  // Load regions on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("region").select("*");
        if (mounted) setRegions((data as any[]) || []);
      } catch (e) {
        console.warn("No se pudo cargar regiones", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load ciudades when region changes
  useEffect(() => {
    if (!region) { setCiudades([]); return; }
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.from("ciudad").select("*").eq("region", region);
        if (mounted) setCiudades((data as any[]) || []);
      } catch (e) {
        console.warn("No se pudo cargar ciudades", e);
      }
    })();
    return () => { mounted = false; };
  }, [region]);

  // Load sii record for this empresa (filtered by empresa)
  useEffect(() => {
    if (!empresa?.id) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from("sii").select("*").eq("empresa", empresa.id).maybeSingle();
        if (error) throw error;
        if (!mounted) return;
        if (data) {
          setSiiId((data as any).id ?? null);
          setSiiNumero((data as any).numeroResolucion ?? (data as any).numero ?? "");
          setSiiFecha((data as any).fechaResolucion ?? null);
          setSiiActeco((data as any).acteco ?? null);
          setSiiFolioBoletas((data as any).folioInicialBoletas ?? (data as any).folio_boletas ?? null);
          setSiiFolioFacturas((data as any).folioInicialFacturas ?? (data as any).folio_facturas ?? null);
          setSiiCertificado((data as any).certificado ?? "");
          setSiiCAF((data as any).caf ?? "");
        }
      } catch (e) {
        console.warn("No se pudo cargar SII", e);
      }
    })();
    return () => { mounted = false; };
  }, [empresa?.id]);

  const handleSave = async () => {
    try {
      const updateObj: any = {
        rutEmpresa: rutEmpresa || null,
        razonSocialEmpresa: razonSocial || null,
        nombreEmpresa: nombreEmpresa || null,
        giroEmpresa: giro || null,
        direccionEmpresa: direccion || null,
        ciudad: ciudad || null,
        region: region || null,
        correoEmpresa: correoEmpresa || null,
        numEmpresa: numEmpresa || null,
        claveCertificadoDigital: certPassword || null,
      };

      let empresaId = empresa?.id ?? null;
      if (empresa && empresa.id) {
        const { error } = await supabase.from("empresa").update(updateObj).eq("id", empresa.id);
        if (error) throw error;
        empresaId = empresa.id;
        toast({ title: "Configuración guardada", description: "Los cambios se actualizaron correctamente." });
      } else {
        // insert new empresa record, set creador to current user id
        const insertObj = { ...updateObj, creador: user?.id || null };
        const { data: inserted, error } = await supabase.from("empresa").insert([insertObj]).select("id").maybeSingle();
        if (error) throw error;
        empresaId = (inserted as any)?.id ?? null;
        toast({ title: "Configuración guardada", description: "Empresa creada correctamente." });
      }

      // Now upsert SII related data (tabla `sii`) for this empresa
      // upload certificado PFX if user selected a file
        if (selectedCertFile) {
        let uploadOk = false;
        try {
          const form = new FormData();
          // send file field with filename 'Certificado.pfx'
          form.append("archivo", selectedCertFile, "Certificado.pfx");
          // include rut so the API can validate empresa ownership
          const rutFormatted = (rutEmpresa || empresa?.rutEmpresa || empresa?.rut || "").toString();
          form.append("rut", rutFormatted);
          // get JWT from supabase session
          const sessionResp = await supabase.auth.getSession();
          const jwt = sessionResp?.data?.session?.access_token ?? "";
          // api key from empresa row
          const apiKey = (empresa?.api_key ?? empresa?.apiKey ?? "") as string;

          const res = await fetch("https://pdv.restify.cl/dte/subir_certificado_pfx.php", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${jwt}`,
              "X-API-KEY": apiKey,
            },
            body: form,
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.warn("Error subiendo certificado:", res.status, text);
            toast({ title: "Error", description: "No se pudo subir el certificado PFX." });
          } else {
            uploadOk = true;
            toast({ title: "Certificado subido", description: "El certificado PFX fue enviado correctamente." });
          }
        } catch (e) {
          console.warn("Error al subir certificado:", e);
          toast({ title: "Error", description: "Error al subir el certificado PFX." });
        }

        // if upload succeeded, call analizar_certificado.php with RUT and clave
        if (uploadOk) {
          try {
            // use stored rut from empresa which is already formatted as XXXXXXXX-X
            const rutFormatted = (rutEmpresa || empresa?.rutEmpresa || empresa?.rut || "").toString();
            const form2 = new FormData();
            form2.append("rut", rutFormatted);
            form2.append("clave", certPassword);

            const r2 = await fetch("https://pdv.restify.cl/dte/analizar_certificado.php", {
              method: "POST",
              body: form2,
            });
            if (!r2.ok) {
              const t = await r2.text().catch(() => "");
              console.warn("Error analizando certificado:", r2.status, t);
              toast({ title: "Error", description: "No se pudo analizar el certificado en el servidor." });
            } else {
              // parse json response and persist into certificado_digital table
              const data = await r2.json().catch(() => null);
              if (data && data.ok) {
                try {
                  const certObj: any = {
                    empresa: empresaId,
                    certificado_pfx: data.certificado_pfx ?? null,
                    serie: data.serie ?? null,
                    nombre_titular: data.nombre ?? null,
                    correo: data.email ?? null,
                    emisor: data.emisor ?? null,
                    valido_desde: data.valido_desde ?? null,
                    valido_hasta: data.valido_hasta ?? null,
                  };
                  // check existing record for this empresa
                  const { data: existing } = await supabase.from("certificado_digital").select("id").eq("empresa", empresaId).maybeSingle();
                  if (existing && (existing as any).id) {
                    await supabase.from("certificado_digital").update(certObj).eq("id", (existing as any).id);
                  } else {
                    await supabase.from("certificado_digital").insert([certObj]);
                  }
                  toast({ title: "Certificado analizado", description: "Análisis completado y guardado correctamente." });
                } catch (e) {
                  console.warn("Error guardando certificado:", e);
                  toast({ title: "Advertencia", description: "Análisis recibido pero no se pudo guardar localmente." });
                }
              } else {
                const txt = JSON.stringify(data) || "OK";
                toast({ title: "Certificado analizado", description: "Análisis completado: " + (txt || "OK") });
              }
            }
          } catch (e) {
            console.warn("Error al analizar certificado:", e);
            toast({ title: "Error", description: "Error al analizar el certificado." });
          }
        }
      }

      try {
        const siiObj: any = {
          numeroResolucion: siiNumero || null,
          fechaResolucion: siiFecha || null,
          acteco: siiActeco || null,
          empresa: empresaId,
        };
        if (siiId) {
          const { error } = await supabase.from("sii").update(siiObj).eq("id", siiId);
          if (error) throw error;
        } else {
          const { data: newSii, error } = await supabase.from("sii").insert([siiObj]).select("id").maybeSingle();
          if (error) throw error;
          if (newSii) setSiiId((newSii as any).id ?? null);
        }
      } catch (e) {
        console.warn("No se pudo guardar SII", e);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message || "No se pudo guardar la configuración." });
    }
  };

  const uploadCertificate = async () => {
    if (!selectedCertFile) {
      toast({ title: "Archivo requerido", description: "Selecciona un archivo .pfx antes de subir." });
      return;
    }
    if (!certPassword) {
      toast({ title: "Clave requerida", description: "Ingresa la clave del certificado." });
      return;
    }
    if (!empresa?.id) {
      toast({ title: "Empresa no encontrada", description: "Guarda primero los datos de la empresa." });
      return;
    }

    setUploadingCert(true);
    try {
      const form = new FormData();
      // API expects field name 'archivo'
      form.append("archivo", selectedCertFile, "Certificado.pfx");
      // include rut so the API can validate empresa ownership
      const rutFormatted = (rutEmpresa || empresa?.rutEmpresa || empresa?.rut || "").toString();
      form.append("rut", rutFormatted);
      const sessionResp = await supabase.auth.getSession();
      const jwt = sessionResp?.data?.session?.access_token ?? "";
      const apiKey = (empresa?.api_key ?? "") as string;
      if (!apiKey) {
        toast({ title: "API key faltante", description: "La empresa no tiene `api_key` configurada." });
        setUploadingCert(false);
        return;
      }

      const res = await fetch("https://pdv.restify.cl/dte/subir_certificado_pfx.php", {
        method: "POST",
        headers: {
          Authorization: `${jwt}`,
          "X-API-KEY": apiKey,
        },
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("Error subiendo certificado:", res.status, text);
        toast({ title: "Error", description: "No se pudo subir el certificado PFX." });
        setUploadingCert(false);
        return;
      }
      toast({ title: "Certificado subido", description: "El certificado PFX fue enviado correctamente." });

      // analizar
      const form2 = new FormData();
      form2.append("rut", rutFormatted);
      form2.append("clave", certPassword);
      const r2 = await fetch("https://pdv.restify.cl/dte/analizar_certificado.php", { method: "POST", body: form2 });
      if (!r2.ok) {
        const t = await r2.text().catch(() => "");
        console.warn("Error analizando certificado:", r2.status, t);
        toast({ title: "Error", description: "No se pudo analizar el certificado en el servidor." });
      } else {
        const data = await r2.json().catch(() => null);
        if (data && data.ok) {
          try {
            const certObj: any = {
              empresa: empresa.id,
              certificado_pfx: data.certificado_pfx ?? null,
              serie: data.serie ?? null,
              nombre_titular: data.nombre ?? null,
              correo: data.email ?? null,
              emisor: data.emisor ?? null,
              valido_desde: data.valido_desde ?? null,
              valido_hasta: data.valido_hasta ?? null,
            };
            const { data: existing } = await supabase.from("certificado_digital").select("id").eq("empresa", empresa.id).maybeSingle();
            if (existing && (existing as any).id) {
              await supabase.from("certificado_digital").update(certObj).eq("id", (existing as any).id);
            } else {
              await supabase.from("certificado_digital").insert([certObj]);
            }
            toast({ title: "Certificado analizado", description: "Análisis completado y guardado correctamente." });
          } catch (e) {
            console.warn("Error guardando certificado:", e);
            toast({ title: "Advertencia", description: "Análisis recibido pero no se pudo guardar localmente." });
          }
        } else {
          const txt = JSON.stringify(data) || "OK";
          toast({ title: "Certificado analizado", description: "Análisis completado: " + (txt || "OK") });
        }
      }

      // save clave to empresa
      try {
        const { error } = await supabase.from("empresa").update({ claveCertificadoDigital: certPassword }).eq("id", empresa.id);
        if (error) throw error;
        toast({ title: "Clave guardada", description: "La clave del certificado fue guardada en la empresa." });
      } catch (e) {
        console.warn("No se pudo guardar la clave en empresa", e);
        toast({ title: "Advertencia", description: "No se pudo guardar la clave en la empresa." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Error inesperado al subir el certificado." });
    } finally {
      setUploadingCert(false);
    }
  };

  const uploadLogo = async () => {
    if (!selectedLogoFile) {
      toast({ title: "Archivo requerido", description: "Selecciona una imagen antes de subir." });
      return;
    }

    if (!empresa?.id) {
      toast({ title: "Empresa no encontrada", description: "Guarda primero los datos de la empresa." });
      return;
    }

    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", selectedLogoFile, selectedLogoFile.name);

      const res = await fetch("https://pdv.restify.cl/media/subir.php", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("Error subiendo logo:", res.status, text);
        toast({ title: "Error", description: "No se pudo subir el logo." });
        return;
      }

      const text = await res.text();
      // Extraer URL de la respuesta HTML (buscar el href en el anchor tag)
      const urlMatch = text.match(/href='([^']+)'/);
      const logoUrl = urlMatch ? urlMatch[1] : null;

      if (logoUrl) {
        // Guardar URL en tabla empresa
        const { error } = await supabase.from("empresa").update({ logo: logoUrl }).eq("id", empresa.id);
        if (error) throw error;
        
        toast({ title: "Logo subido", description: "El logo fue guardado correctamente." });
      } else {
        toast({ title: "Advertencia", description: "Logo subido pero no se pudo extraer la URL." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Error inesperado al subir el logo." });
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadPortada = async () => {
    if (!selectedPortadaFile) {
      toast({ title: "Archivo requerido", description: "Selecciona una imagen antes de subir." });
      return;
    }

    if (!empresa?.id) {
      toast({ title: "Empresa no encontrada", description: "Guarda primero los datos de la empresa." });
      return;
    }

    setUploadingPortada(true);
    try {
      const form = new FormData();
      form.append("file", selectedPortadaFile, selectedPortadaFile.name);

      const res = await fetch("https://pdv.restify.cl/media/subir.php", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("Error subiendo portada:", res.status, text);
        toast({ title: "Error", description: "No se pudo subir la portada." });
        return;
      }

      const text = await res.text();
      // Extraer URL de la respuesta HTML (buscar el href en el anchor tag)
      const urlMatch = text.match(/href='([^']+)'/);
      const portadaUrl = urlMatch ? urlMatch[1] : null;

      if (portadaUrl) {
        // Guardar URL en tabla empresa
        const { error } = await supabase.from("empresa").update({ imgEmpresa: portadaUrl }).eq("id", empresa.id);
        if (error) throw error;
        
        toast({ title: "Portada subida", description: "La portada fue guardada correctamente." });
      } else {
        toast({ title: "Advertencia", description: "Portada subida pero no se pudo extraer la URL." });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Error inesperado al subir la portada." });
    } finally {
      setUploadingPortada(false);
    }
  };;

  const uploadCafBoletas = async () => {
    if (!selectedCafFile) {
      toast({ title: "Archivo requerido", description: "Selecciona un archivo .xml antes de subir." });
      return;
    }
    if (!empresa?.id) {
      toast({ title: "Empresa no encontrada", description: "Guarda primero los datos de la empresa." });
      return;
    }

    setUploadingCaf(true);
    try {
      const form = new FormData();
      form.append("archivo", selectedCafFile, selectedCafFile.name || "CAF_boletas.xml");
      const rutFormatted = (rutEmpresa || empresa?.rutEmpresa || empresa?.rut || "").toString();
      form.append("rut", rutFormatted);

      const sessionResp = await supabase.auth.getSession();
      const jwt = sessionResp?.data?.session?.access_token ?? "";
      const apiKey = (empresa?.api_key ?? empresa?.apiKey ?? "") as string;
      if (!apiKey) {
        toast({ title: "API key faltante", description: "La empresa no tiene `api_key` configurada." });
        setUploadingCaf(false);
        return;
      }

      const res = await fetch("https://pdv.restify.cl/dte/subir_caf_boletas.php", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "X-API-KEY": apiKey,
        },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("Error subiendo CAF:", res.status, text);
        toast({ title: "Error", description: "No se pudo subir el CAF de boletas." });
        return;
      }

      toast({ title: "CAF subido", description: "El CAF de boletas fue enviado correctamente." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Error inesperado al subir el CAF." });
    } finally {
      setUploadingCaf(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="page-header">Configuración</h1>
          <p className="page-subtitle mt-1">Administra la información de tu empresa</p>
        </div>

        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="empresa">Datos Empresa</TabsTrigger>
            <TabsTrigger value="facturacion">Facturación</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Información de la Empresa
                </CardTitle>
                <CardDescription>
                  Datos que aparecerán en tus documentos tributarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>RUT Empresa</Label>
                    <Input
                      placeholder="76.XXX.XXX-X"
                      value={rutEmpresa}
                      onChange={(e) => setRutEmpresa((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Razón Social</Label>
                    <Input
                      placeholder="Nombre legal de la empresa"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial((e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nombre de Fantasía</Label>
                  <Input
                    placeholder="Nombre comercial"
                    value={nombreEmpresa}
                    onChange={(e) => setnombreEmpresa((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giro Comercial</Label>
                  <Input
                    placeholder="Actividad económica"
                    value={giro}
                    onChange={(e) => setGiro((e.target as HTMLInputElement).value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Dirección
                </CardTitle>
                <CardDescription>Dirección legal de la empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Calle y Número</Label>
                    <Input
                      placeholder="Av. Ejemplo 1234"
                      value={direccion}
                      onChange={(e) => setDireccion((e.target as HTMLInputElement).value)}
                    />
                  </div>
                 
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Región</Label>
                    <Select value={region ? String(region) : ""} onValueChange={(v) => { setRegion(v ? Number(v) : null); setCiudad(null); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar región" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ciudad / Comuna</Label>
                    <Select value={ciudad ? String(ciudad) : ""} onValueChange={(v) => setCiudad(v ? Number(v) : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input placeholder="Buscar ciudad..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} />
                        </div>
                        <div className="max-h-56 overflow-auto">
                          {ciudades.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Contacto
                </CardTitle>
                <CardDescription>Información de contacto de la empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="contacto@empresa.cl"
                      value={correoEmpresa}
                      onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input placeholder="+56 2 2345 6789" value={numEmpresa} onChange={(e) => setTelefono((e.target as HTMLInputElement).value)} />
                  </div>
                </div>
                
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="facturacion" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Configuración de Facturación
                </CardTitle>
                <CardDescription>
                  Configura los parámetros de tus documentos tributarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Resolución SII (número)</Label>
                    <Input placeholder="Número de resolución" value={siiNumero} onChange={(e) => setSiiNumero((e.target as HTMLInputElement).value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Resolución</Label>
                    <Input type="date" value={siiFecha ?? ""} onChange={(e) => setSiiFecha((e.target as HTMLInputElement).value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Acteco (código actividad económica)</Label>
                    <Input type="number" placeholder="acteco" value={siiActeco ?? ""} onChange={(e) => setSiiActeco(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mensaje en Documentos (opcional)</Label>
                  <Textarea
                    placeholder="Texto adicional que aparecerá en sus documentos"
                    defaultValue="Gracias por su preferencia. Los productos no tienen cambio ni devolución."
                    rows={3}
                  />
                </div>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Certificado digital</CardTitle>
                    <CardDescription>Sube tu archivo .pfx y proporciona la clave</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Archivo .pfx</Label>
                      <input
                        type="file"
                        accept=".pfx"
                        onChange={(e) => setSelectedCertFile(e.target.files?.[0] ?? null)}
                        className="w-full"
                      />
                      {selectedCertFile && <div className="text-sm text-muted-foreground">Archivo seleccionado: {selectedCertFile.name}</div>}
                    </div>
                    <div className="space-y-2 mt-2">
                      <Label>Clave del Certificado</Label>
                      <Input type="password" placeholder="Clave del certificado" value={certPassword} onChange={(e) => setCertPassword((e.target as HTMLInputElement).value)} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={uploadCertificate} disabled={uploadingCert || !selectedCertFile || !certPassword}>
                        {uploadingCert ? 'Subiendo...' : 'Subir y Guardar Certificado'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>CAF / Folios</CardTitle>
                    <CardDescription>Carga tu archivo CAF (.xml) para la emisión de boletas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Archivo CAF (.xml)</Label>
                      <input
                        type="file"
                        accept=".xml"
                        onChange={(e) => setSelectedCafFile(e.target.files?.[0] ?? null)}
                        className="w-full"
                      />
                      {selectedCafFile && (
                        <div className="text-sm text-muted-foreground">
                          Archivo seleccionado: {selectedCafFile.name}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>Siguiente Folio a Usar</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej: 1000"
                        value={siiFolioSiguiente ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setSiiFolioSiguiente(val ? Number(val) : null);
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={uploadCafBoletas} disabled={uploadingCaf || !selectedCafFile || !siiFolioSiguiente}>
                        {uploadingCaf ? "Subiendo..." : "Subir CAF de boletas"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Personalización de Documentos</CardTitle>
                <CardDescription>
                  Personaliza la apariencia de tus boletas y facturas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Logo de la Empresa</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {logoPreview ? (
                        <div className="w-32 h-32 rounded-lg bg-white flex items-center justify-center overflow-hidden border">
                          <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {selectedLogoFile ? selectedLogoFile.name : "Selecciona una imagen PNG o JPG"}
                      </p>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedLogoFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setLogoPreview(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="logo-input"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("logo-input")?.click()}
                      >
                        Seleccionar Logo
                      </Button>
                      {selectedLogoFile && (
                        <Button onClick={uploadLogo} disabled={uploadingLogo} size="sm">
                          {uploadingLogo ? "Subiendo..." : "Subir Logo"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Portada de la Empresa - Para sitio web o sistemas donde integres tu empresa.</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {portadaPreview ? (
                        <div className="w-full h-40 rounded-lg bg-white flex items-center justify-center overflow-hidden border">
                          <img src={portadaPreview} alt="Portada preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-40 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {selectedPortadaFile ? selectedPortadaFile.name : "Selecciona una imagen PNG o JPG"}
                      </p>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedPortadaFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setPortadaPreview(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="portada-input"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("portada-input")?.click()}
                      >
                        Seleccionar Portada
                      </Button>
                      {selectedPortadaFile && (
                        <Button onClick={uploadPortada} disabled={uploadingPortada} size="sm">
                          {uploadingPortada ? "Subiendo..." : "Subir Portada"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
