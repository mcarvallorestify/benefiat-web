import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Phone, MapPin, FileText, Save, Plus, Trash2, Users, Shield, Search, CreditCard } from "lucide-react";
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
import { useSucursales } from "@/hooks/useSucursales";
import { supabase } from "@/lib/supabaseClient";
import { PlanesModal } from "@/components/PlanesModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PLANES_RESUMEN = [
  {
    planIds: [10, 11],
    nombre: "Emprendedor",
    descripcion: "Ideal para negocios que recién comienzan",
    precioMensual: "15.990",
    periodo: "/mes con iva",
  },
  {
    planIds: [12, 13],
    nombre: "Profesional",
    descripcion: "Para negocios en crecimiento",
    precioMensual: "20.990",
    periodo: "/mes con iva",
  },
  {
    planIds: [14, 15],
    nombre: "Empresarial",
    descripcion: "Para empresas con alto volumen",
    precioMensual: "29.990",
    periodo: "/mes con iva",
  },
];

export default function Configuracion() {
  const { user } = useUser();
  const { empresa, loading: loadingEmpresa } = useEmpresa(user?.id);
  const { sucursales, planInfo, reloadSucursales } = useSucursales(empresa?.id);
  const planActual = PLANES_RESUMEN.find((plan) =>
    planInfo.planId !== null ? plan.planIds.includes(planInfo.planId) : false
  );

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

  // Sucursales
  const [openNuevaSucursal, setOpenNuevaSucursal] = useState(false);
  const [nuevaSucursalNombre, setNuevaSucursalNombre] = useState("");
  const [nuevaSucursalDireccion, setNuevaSucursalDireccion] = useState("");
  const [creandoSucursal, setCreandoSucursal] = useState(false);
  const [openPlanesModal, setOpenPlanesModal] = useState(false);

  // Roles y Permisos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [editandoRol, setEditandoRol] = useState<string | null>(null);
  const [nuevoRol, setNuevoRol] = useState("");
  const [searchUsuarios, setSearchUsuarios] = useState("");

  // Tarjetas de usuario
  const [tarjetas, setTarjetas] = useState<any[]>([]);
  const [loadingTarjetas, setLoadingTarjetas] = useState(false);
  const [openNuevaTarjeta, setOpenNuevaTarjeta] = useState(false);
  const [guardandoTarjeta, setGuardandoTarjeta] = useState(false);
  const [actualizandoPredeterminada, setActualizandoPredeterminada] = useState(false);
  const [eliminandoTarjetaId, setEliminandoTarjetaId] = useState<number | null>(null);
  const [formNumTarjeta, setFormNumTarjeta] = useState("");
  const [formMesVencimiento, setFormMesVencimiento] = useState("");
  const [formAnnioVencimiento, setFormAnnioVencimiento] = useState("");
  const [formCvv, setFormCvv] = useState("");
  const [formNombreTarjeta, setFormNombreTarjeta] = useState("");
  const [formRutTarjeta, setFormRutTarjeta] = useState("");
  const [formPredeterminada, setFormPredeterminada] = useState(false);

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

  // Cargar usuarios para gestión de roles
  useEffect(() => {
    if (!empresa?.id) return;
    let mounted = true;
    setLoadingUsuarios(true);
    supabase
      .from("user")
      .select("tablaID, nombre, apellido, email, run, dv, rol")
      .eq("empresa", empresa.id)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Error cargando usuarios:", error);
          toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" });
        } else {
          setUsuarios(data || []);
        }
        setLoadingUsuarios(false);
      });
    return () => { mounted = false; };
  }, [empresa?.id]);

  const handleRutTarjetaChange = (value: string) => {
    // Remover caracteres no válidos, mantener solo números y K
    let input = value.toUpperCase().replace(/[^0-9K]/g, "");

    // Obtener solo los dígitos (sin K)
    let digits = input.replace(/K/g, "");

    // Limitar a máximo 9 caracteres (8 dígitos + 1 DV)
    if (digits.length > 9) {
      digits = digits.slice(0, 9);
    }

    let formatted = digits;

    // Si tiene K, es el DV
    if (input.includes("K")) {
      const numPart = digits.slice(0, 8);
      formatted = `${numPart}-K`;
    }
    // Si tiene exactamente 9 dígitos, formatear como 8-1
    else if (digits.length === 9) {
      formatted = `${digits.slice(0, 8)}-${digits[8]}`;
    }
    // Si tiene 8 dígitos, mostrar como 7-1 (RUT < 10M)
    else if (digits.length === 8) {
      formatted = `${digits.slice(0, 7)}-${digits[7]}`;
    }

    setFormRutTarjeta(formatted);
  };

  const resetFormTarjeta = () => {
    setFormNumTarjeta("");
    setFormMesVencimiento("");
    setFormAnnioVencimiento("");
    setFormCvv("");
    setFormNombreTarjeta("");
    setFormRutTarjeta("");
    setFormPredeterminada(false);
  };

  const cargarTarjetas = async (empresaId: number) => {
    setLoadingTarjetas(true);
    const { data, error } = await supabase
      .from("tarjetaUsuario")
      .select(
        "id, created_at, numTarjeta, mesVencimiento, annioVencimiento, cvv, nombreTarjeta, rutTarjeta, primerosSeisdigitos, ultmosCuatrodigitos, usuario, predeterminado, empresa"
      )
      .eq("empresa", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando tarjetas:", error);
      toast({ title: "Error", description: "No se pudieron cargar las tarjetas", variant: "destructive" });
    } else {
      setTarjetas(data || []);
    }
    setLoadingTarjetas(false);
  };

  const establecerPredeterminada = async (tarjetaId: number) => {
    if (!empresa?.id) return;
    setActualizandoPredeterminada(true);
    try {
      const { error: resetError } = await supabase
        .from("tarjetaUsuario")
        .update({ predeterminado: false })
        .eq("empresa", empresa.id);
      if (resetError) throw resetError;

      const { error } = await supabase
        .from("tarjetaUsuario")
        .update({ predeterminado: true })
        .eq("id", tarjetaId);
      if (error) throw error;

      setTarjetas((prev) =>
        prev.map((t) => ({ ...t, predeterminado: t.id === tarjetaId }))
      );
      toast({ title: "Tarjeta predeterminada", description: "Se actualizó la tarjeta de cobro." });
    } catch (e: any) {
      console.error("Error actualizando predeterminada:", e);
      toast({ title: "Error", description: e?.message || "No se pudo actualizar la tarjeta", variant: "destructive" });
    } finally {
      setActualizandoPredeterminada(false);
    }
  };

  const eliminarTarjeta = async (tarjetaId: number) => {
    if (!empresa?.id) return;
    if (tarjetas.length <= 1) {
      toast({ title: "Acción no permitida", description: "Debe existir al menos una tarjeta para cobros.", variant: "destructive" });
      return;
    }

    setEliminandoTarjetaId(tarjetaId);
    try {
      const tarjeta = tarjetas.find((t) => t.id === tarjetaId);
      const { error } = await supabase
        .from("tarjetaUsuario")
        .delete()
        .eq("id", tarjetaId);
      if (error) throw error;

      let nuevas = tarjetas.filter((t) => t.id !== tarjetaId);

      if (tarjeta?.predeterminado && nuevas.length > 0) {
        const nuevaPred = nuevas[0];
        await supabase
          .from("tarjetaUsuario")
          .update({ predeterminado: true })
          .eq("id", nuevaPred.id);
        nuevas = nuevas.map((t) => ({ ...t, predeterminado: t.id === nuevaPred.id }));
      }

      setTarjetas(nuevas);
      toast({ title: "Tarjeta eliminada", description: "La tarjeta fue eliminada correctamente." });
    } catch (e: any) {
      console.error("Error eliminando tarjeta:", e);
      toast({ title: "Error", description: e?.message || "No se pudo eliminar la tarjeta", variant: "destructive" });
    } finally {
      setEliminandoTarjetaId(null);
    }
  };

  const crearTarjeta = async () => {
    if (!empresa?.id || !user?.id) return;
    const numTarjetaLimpia = formNumTarjeta.replace(/[^0-9]/g, "");
    const mes = formMesVencimiento.replace(/[^0-9]/g, "");
    const annio = formAnnioVencimiento.replace(/[^0-9]/g, "");
    const cvv = formCvv.replace(/[^0-9]/g, "");

    if (!numTarjetaLimpia || numTarjetaLimpia.length < 13) {
      toast({ title: "Datos incompletos", description: "Ingresa un número de tarjeta válido.", variant: "destructive" });
      return;
    }
    if (!mes || Number(mes) < 1 || Number(mes) > 12) {
      toast({ title: "Datos incompletos", description: "Mes de vencimiento inválido.", variant: "destructive" });
      return;
    }
    if (!annio || annio.length < 4) {
      toast({ title: "Datos incompletos", description: "Año de vencimiento inválido.", variant: "destructive" });
      return;
    }
    if (!cvv || cvv.length < 3) {
      toast({ title: "Datos incompletos", description: "CVV inválido.", variant: "destructive" });
      return;
    }

    setGuardandoTarjeta(true);
    try {
      const debeSerPredeterminada = tarjetas.length === 0 ? true : formPredeterminada;
      if (debeSerPredeterminada) {
        await supabase
          .from("tarjetaUsuario")
          .update({ predeterminado: false })
          .eq("empresa", empresa.id);
      }

      const payload: any = {
        numTarjeta: Number(numTarjetaLimpia),
        mesVencimiento: Number(mes),
        annioVencimiento: Number(annio),
        cvv: Number(cvv),
        nombreTarjeta: formNombreTarjeta || null,
        rutTarjeta: formRutTarjeta || null,
        primerosSeisdigitos: Number(numTarjetaLimpia.slice(0, 6)),
        ultmosCuatrodigitos: Number(numTarjetaLimpia.slice(-4)),
        usuario: user.id,
        predeterminado: debeSerPredeterminada,
        empresa: empresa.id,
      };

      const { data, error } = await supabase
        .from("tarjetaUsuario")
        .insert([payload])
        .select()
        .maybeSingle();
      if (error) throw error;

      if (data) {
        setTarjetas((prev) => [data, ...prev.map((t) => ({ ...t, predeterminado: debeSerPredeterminada ? false : t.predeterminado }))]);
      }
      toast({ title: "Tarjeta agregada", description: "La tarjeta se agregó correctamente." });
      resetFormTarjeta();
      setOpenNuevaTarjeta(false);
    } catch (e: any) {
      console.error("Error creando tarjeta:", e);
      toast({ title: "Error", description: e?.message || "No se pudo agregar la tarjeta", variant: "destructive" });
    } finally {
      setGuardandoTarjeta(false);
    }
  };

  // Cargar tarjetas del usuario/empresa
  useEffect(() => {
    if (!empresa?.id) return;
    (async () => {
      await cargarTarjetas(empresa.id);
    })();
  }, [empresa?.id]);

  const actualizarRolUsuario = async (tablaID: string, nuevoRol: string) => {
    try {
      const { error } = await supabase
        .from("user")
        .update({ rol: nuevoRol })
        .eq("tablaID", tablaID);

      if (error) throw error;

      // Actualizar estado local
      setUsuarios((prev) =>
        prev.map((u) => (u.tablaID === tablaID ? { ...u, rol: nuevoRol } : u))
      );

      toast({ title: "Rol actualizado", description: "El rol del usuario se actualizó correctamente" });
      setEditandoRol(null);
      setNuevoRol("");
    } catch (error: any) {
      console.error("Error actualizando rol:", error);
      toast({ title: "Error", description: error.message || "No se pudo actualizar el rol", variant: "destructive" });
    }
  };

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
  };

  const crearNuevaSucursal = async () => {
    if (!nuevaSucursalNombre.trim()) {
      toast({ title: "Nombre requerido", description: "Ingresa un nombre para la sucursal." });
      return;
    }
    if (!empresa?.id) {
      toast({ title: "Empresa no encontrada", description: "Primero configura tu empresa." });
      return;
    }

    setCreandoSucursal(true);
    try {
      const { error } = await supabase.from("Sucursal").insert([{
        empresa: empresa.id,
        nombre: nuevaSucursalNombre,
        direccion: nuevaSucursalDireccion || null,
      }]);

      if (error) throw error;

      toast({ title: "Sucursal creada", description: "La nueva sucursal fue creada correctamente." });
      setNuevaSucursalNombre("");
      setNuevaSucursalDireccion("");
      setOpenNuevaSucursal(false);
      await reloadSucursales();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message || "No se pudo crear la sucursal." });
    } finally {
      setCreandoSucursal(false);
    }
  };

  const eliminarSucursal = async (sucursalId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta sucursal?")) return;

    try {
      const { error } = await supabase.from("Sucursal").delete().eq("id", sucursalId);
      if (error) throw error;

      toast({ title: "Sucursal eliminada", description: "La sucursal fue eliminada correctamente." });
      await reloadSucursales();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message || "No se pudo eliminar la sucursal." });
    }
  };

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
            <TabsTrigger value="sucursales">Sucursales</TabsTrigger>
            <TabsTrigger value="roles">Roles y Permisos</TabsTrigger>
            <TabsTrigger value="tarjetas">Tarjetas</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
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

          <TabsContent value="sucursales" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Gestión de Sucursales
                    </CardTitle>
                    <CardDescription>
                      Tu plan permite {planInfo.maxSucursales === null ? "ilimitadas" : planInfo.maxSucursales} sucursales
                    </CardDescription>
                  </div>
                  {planInfo.canCreateMore && (
                    <Dialog open={openNuevaSucursal} onOpenChange={setOpenNuevaSucursal}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" />
                          Nueva Sucursal
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crear Nueva Sucursal</DialogTitle>
                          <DialogDescription>
                            Ingresa los datos de la nueva sucursal
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Nombre de la Sucursal *</Label>
                            <Input
                              placeholder="Ej: Sucursal Centro"
                              value={nuevaSucursalNombre}
                              onChange={(e) => setNuevaSucursalNombre(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dirección</Label>
                            <Input
                              placeholder="Ej: Av. Principal 123"
                              value={nuevaSucursalDireccion}
                              onChange={(e) => setNuevaSucursalDireccion(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setOpenNuevaSucursal(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={crearNuevaSucursal} disabled={creandoSucursal}>
                            {creandoSucursal ? "Creando..." : "Crear Sucursal"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {sucursales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay sucursales creadas
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sucursales.map((suc) => (
                      <div key={suc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{suc.nombre || `Sucursal ${suc.id}`}</h4>
                          {suc.direccion && (
                            <p className="text-sm text-muted-foreground">{suc.direccion}</p>
                          )}
                        </div>
                        {sucursales.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarSucursal(suc.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!planInfo.canCreateMore && (
                  <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Has alcanzado el límite de sucursales para tu plan actual
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      ¿Necesitas más sucursales para tu negocio? Actualiza tu plan para obtener más ubicaciones.
                    </p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setOpenPlanesModal(true)}>
                      Ver Planes Disponibles
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Gestión de Roles y Permisos
                </CardTitle>
                <CardDescription>
                  Asigna roles a los usuarios de tu empresa para controlar sus permisos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchUsuarios}
                      onChange={(e) => setSearchUsuarios(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {loadingUsuarios ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando usuarios...
                  </div>
                ) : usuarios.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No hay usuarios</h3>
                    <p className="text-sm text-muted-foreground">
                      Los usuarios aparecerán aquí cuando se creen en el sistema
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usuarios
                      .filter((u) => {
                        const search = searchUsuarios.toLowerCase();
                        return (
                          !search ||
                          u.nombre?.toLowerCase().includes(search) ||
                          u.apellido?.toLowerCase().includes(search) ||
                          u.email?.toLowerCase().includes(search) ||
                          u.run?.toString().includes(search)
                        );
                      })
                      .map((usuario) => (
                        <div
                          key={usuario.tablaID}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {usuario.nombre} {usuario.apellido}
                              </h4>
                              <Badge
                                variant={
                                  usuario.rol === "Administrador"
                                    ? "default"
                                    : usuario.rol === "Vendedor"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {usuario.rol || "Sin rol"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{usuario.email}</p>
                            {usuario.run && (
                              <p className="text-xs text-muted-foreground">
                                RUN: {usuario.run}-{usuario.dv}
                              </p>
                            )}
                          </div>

                          {editandoRol === usuario.tablaID ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={nuevoRol}
                                onValueChange={setNuevoRol}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Administrador">Administrador</SelectItem>
                                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                                  <SelectItem value="Contador">Contador</SelectItem>
                                  <SelectItem value="Bodeguero">Bodeguero</SelectItem>
                                  <SelectItem value="Cliente">Cliente</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={() => actualizarRolUsuario(usuario.tablaID, nuevoRol)}
                                disabled={!nuevoRol}
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditandoRol(null);
                                  setNuevoRol("");
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditandoRol(usuario.tablaID);
                                setNuevoRol(usuario.rol || "");
                              }}
                            >
                              Cambiar Rol
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Permisos por Rol
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium">Administrador</p>
                      <p className="text-muted-foreground">
                        Acceso completo a todas las funcionalidades del sistema
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Vendedor</p>
                      <p className="text-muted-foreground">
                        Acceso solo a Punto de Venta para realizar ventas
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Contador</p>
                      <p className="text-muted-foreground">
                        Acceso a reportes, documentos y configuración financiera
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Bodeguero</p>
                      <p className="text-muted-foreground">
                        Acceso a inventario, productos y punto de venta
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Cliente</p>
                      <p className="text-muted-foreground">
                        Acceso limitado como cliente del sistema
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tarjetas" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Tarjetas de Cobro
                  </CardTitle>
                  <CardDescription>
                    Tarjetas asociadas a tu empresa. La tarjeta marcada como predeterminada será usada para cobros.
                  </CardDescription>
                </div>
                <Button onClick={() => { resetFormTarjeta(); setOpenNuevaTarjeta(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar tarjeta
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingTarjetas ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando tarjetas...
                  </div>
                ) : tarjetas.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No hay tarjetas registradas</h3>
                    <p className="text-sm text-muted-foreground">
                      Debes registrar al menos una tarjeta para los cobros.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tarjetas.map((tarjeta) => {
                      const ultimos = tarjeta.ultmosCuatrodigitos ?? tarjeta.numTarjeta?.toString().slice(-4) ?? "";
                      const primeros = tarjeta.primerosSeisdigitos ?? tarjeta.numTarjeta?.toString().slice(0, 6) ?? "";
                      return (
                        <div
                          key={tarjeta.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              
                              {tarjeta.predeterminado ? (
                                <Badge variant="default">Predeterminada</Badge>
                              ) : (
                                <Badge variant="outline">Secundaria</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {primeros ? `${primeros}••••••` : "••••••"} •••• {ultimos}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vence {tarjeta.mesVencimiento?.toString().padStart(2, "0") || "--"}/
                              {tarjeta.annioVencimiento || "----"}
                            </p>
                            {tarjeta.nombreTarjeta && (
                              <p className="text-xs text-muted-foreground">
                                {tarjeta.nombreTarjeta}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!tarjeta.predeterminado && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => establecerPredeterminada(tarjeta.id)}
                                disabled={actualizandoPredeterminada}
                              >
                                Hacer predeterminada
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => eliminarTarjeta(tarjeta.id)}
                              disabled={eliminandoTarjetaId === tarjeta.id || actualizandoPredeterminada}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loadingTarjetas && tarjetas.length > 0 && !tarjetas.some((t) => t.predeterminado) && (
                  <div className="mt-4 p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                    <p className="text-sm font-medium text-destructive">
                      No hay tarjeta predeterminada para cobros.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Debe existir una tarjeta marcada como predeterminada para poder realizar cobros.
                    </p>
                  </div>
                )}

                <Dialog open={openNuevaTarjeta} onOpenChange={(open) => { setOpenNuevaTarjeta(open); if (!open) resetFormTarjeta(); }}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Agregar tarjeta</DialogTitle>
                      <DialogDescription>
                        Ingresa los datos de la nueva tarjeta. No puedes quedar sin tarjeta para cobros.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Número de tarjeta</Label>
                        <Input
                          value={formNumTarjeta}
                          onChange={(e) => setFormNumTarjeta(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Mes vencimiento</Label>
                          <Input
                            value={formMesVencimiento}
                            onChange={(e) => setFormMesVencimiento(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="MM"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Año vencimiento</Label>
                          <Input
                            value={formAnnioVencimiento}
                            onChange={(e) => setFormAnnioVencimiento(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="YYYY"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>CVV</Label>
                          <Input
                            value={formCvv}
                            onChange={(e) => setFormCvv(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="123"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Nombre en tarjeta</Label>
                          <Input
                            value={formNombreTarjeta}
                            onChange={(e) => setFormNombreTarjeta(e.target.value)}
                            placeholder="Nombre"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>RUT tarjeta</Label>
                          <Input
                            value={formRutTarjeta}
                            onChange={(e) => handleRutTarjetaChange(e.target.value)}
                            placeholder="12.345.678-9"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          id="predeterminada"
                          type="checkbox"
                          checked={formPredeterminada || tarjetas.length === 0}
                          onChange={(e) => setFormPredeterminada(e.target.checked)}
                          disabled={tarjetas.length === 0}
                        />
                        <label htmlFor="predeterminada" className="text-sm">
                          Usar como predeterminada para cobros
                        </label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpenNuevaTarjeta(false)} disabled={guardandoTarjeta}>
                        Cancelar
                      </Button>
                      <Button onClick={crearTarjeta} disabled={guardandoTarjeta}>
                        {guardandoTarjeta ? "Guardando..." : "Guardar tarjeta"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Plan Actual
                </CardTitle>
                <CardDescription>
                  Gestiona tu suscripción y actualiza tu plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {planActual ? (
                  <>
                    <div className="p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-1">
                            {planActual.nombre || "Plan Actual"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {planActual.descripcion || "Tu plan actual"}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">
                            ${planActual.precioMensual || "0"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {planActual.periodo || "mes"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span>
                            {planInfo.maxSucursales === null 
                              ? "Sucursales ilimitadas" 
                              : `Hasta ${planInfo.maxSucursales} ${planInfo.maxSucursales === 1 ? 'sucursal' : 'sucursales'}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>Documentos electrónicos ilimitados</span>
                        </div>
                      </div>

                      {empresa?.dias_restantes_plan !== undefined && empresa?.dias_restantes_plan !== null && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            {empresa.dias_restantes_plan > 0 
                              ? `${empresa.dias_restantes_plan} días restantes en tu período actual`
                              : "Período de facturación próximo a renovarse"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={() => setOpenPlanesModal(true)} 
                        className="w-full"
                        size="lg"
                      >
                        Cambiar de Plan
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Actualiza o cambia tu plan en cualquier momento. El cambio es efectivo de inmediato.
                      </p>
                    </div>

                    <Card className="border-muted-foreground/20">
                      <CardHeader>
                        <CardTitle className="text-base">Sucursales Activas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Estás usando {sucursales.length} de {planInfo.maxSucursales === null ? '∞' : planInfo.maxSucursales} sucursales
                          </span>
                          <div className="flex gap-1">
                            {Array.from({ length: planInfo.maxSucursales || 3 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < sucursales.length ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                            ))}
                            {planInfo.maxSucursales === null && (
                              <span className="text-xs text-muted-foreground ml-1">∞</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No hay plan asignado</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Selecciona un plan para comenzar a usar todas las funcionalidades
                    </p>
                    <Button onClick={() => setOpenPlanesModal(true)}>
                      Ver Planes Disponibles
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <PlanesModal open={openPlanesModal} onOpenChange={setOpenPlanesModal} />
    </AppLayout>
  );
}
