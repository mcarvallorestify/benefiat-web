import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Validación de RUT (DV) adaptada desde Clientes
function _calcularDigitoVerificador(numero: string): string {
  let suma = 0;
  let multiplicador = 2;
  for (let i = numero.length - 1; i >= 0; i--) {
    const digito = parseInt(numero[i], 10);
    suma += digito * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = suma % 11;
  let dv = String(11 - resto);
  if (dv === "11") return "0";
  if (dv === "10") return "K";
  return dv;
}

function validarRut(run: string | number, dv: string): boolean {
  try {
    const runStr = String(run).replace(/[^0-9]/g, "");
    const dvNormalizado = String(dv).toUpperCase();
    if (!/^[0-9K]$/.test(dvNormalizado)) return false;
    if (runStr.length < 7 || runStr.length > 8) return false;
    const dvCalculado = _calcularDigitoVerificador(runStr);
    return dvNormalizado === dvCalculado;
  } catch (e) {
    return false;
  }
}

export default function CrearCuenta() {
  const { user } = useUser();
  const { empresa } = useEmpresa(user?.id);

  const [formNombre, setFormNombre] = useState("");
  const [formApellido, setFormApellido] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formNumeroContacto, setFormNumeroContacto] = useState("");
  const [formDireccion, setFormDireccion] = useState("");
  const [formRun, setFormRun] = useState("");
  const [formDv, setFormDv] = useState("");
  const [isEmpresa, setIsEmpresa] = useState(false);
  const [formRazSocial, setFormRazSocial] = useState("");
  const [formGiro, setFormGiro] = useState("");
  const [formRegion, setFormRegion] = useState<number | null>(null);
  const [formCiudad, setFormCiudad] = useState<number | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!formRegion) {
      setCiudades([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("ciudad")
          .select("*")
          .eq("region", formRegion);
        if (mounted) setCiudades((data as any[]) || []);
      } catch (e) {
        console.warn("No se pudo cargar ciudades", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [formRegion]);

  const filteredCiudades = ciudades.filter((c) => {
    if (!citySearch) return true;
    return (c.nombre || "")
      .toString()
      .toLowerCase()
      .includes(citySearch.toLowerCase());
  });

  const resetForm = () => {
    setFormNombre("");
    setFormApellido("");
    setFormEmail("");
    setFormPassword("");
    setFormNumeroContacto("");
    setFormDireccion("");
    setFormRun("");
    setFormDv("");
    setIsEmpresa(false);
    setFormRazSocial("");
    setFormGiro("");
    setFormRegion(null);
    setFormCiudad(null);
    setCitySearch("");
    setCreateError("");
  };

  const handleCrearCuenta = async () => {
    setCreateError("");
    setSuccessMsg("");

    if (!formNombre || (!formApellido && !isEmpresa)) {
      setCreateError("Nombre y apellido son requeridos");
      return;
    }
    if (!formEmail) {
      setCreateError("Email es requerido");
      return;
    }
    if (!formPassword) {
      setCreateError("Contraseña es requerida");
      return;
    }
    if (!validarRut(formRun, formDv)) {
      setCreateError("RUN/DV inválido");
      return;
    }

    const atIdx = formEmail.indexOf("@");
    if (atIdx <= 0) {
      setCreateError("Email inválido");
      return;
    }
    const correoUser = `${formEmail.slice(0, atIdx)}74${formEmail.slice(atIdx)}`;

    setCreating(true);
    try {
      const dataObj: any = {
        nombre: formNombre,
        apellido: formApellido || null,
        email: formEmail,
        correoUser,
        numeroContacto: formNumeroContacto || null,
        direccion: formDireccion || null,
        run: Number(String(formRun).replace(/\D/g, "")),
        dv: String(formDv),
        empresa: empresa?.id || null,
        estado: "activo",
        pais: "Chile",
        region: formRegion || null,
        ciudad: formCiudad || null,
      };

      if (isEmpresa) {
        dataObj.raz_social = formRazSocial || null;
        dataObj.giro = formGiro || null;
      }

      const { error } = await supabase.from("user").insert([dataObj]);
      if (error) {
        console.error("Error creando usuario en tabla user", error);
        setCreateError(error.message || "Error guardando datos");
        setCreating(false);
        return;
      }

      const { error: authError } = await supabase.auth.signUp({
        email: correoUser,
        password: formPassword,
      });

      if (authError) {
        setCreateError(authError.message || "Error creando cuenta");
        setCreating(false);
        return;
      }

      setSuccessMsg("Cuenta creada correctamente");
      resetForm();
    } catch (e: any) {
      console.error(e);
      setCreateError(e?.message || "Error desconocido");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Crear Cuenta</h1>
          <p className="page-subtitle mt-1">Registro manual de usuario</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 max-w-3xl">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nombre</Label>
                <Input
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Nombre"
                />
              </div>
              <div className="grid gap-2">
                <Label>Apellido</Label>
                <Input
                  value={formApellido}
                  onChange={(e) => setFormApellido(e.target.value)}
                  placeholder="Apellido"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>RUN (8 dígitos)</Label>
                <Input
                  value={formRun}
                  onChange={(e) =>
                    setFormRun(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  maxLength={8}
                  placeholder="12345678"
                />
              </div>
              <div className="grid gap-2">
                <Label>DV</Label>
                <Input
                  value={formDv}
                  onChange={(e) => setFormDv(e.target.value.slice(0, 1))}
                  maxLength={1}
                  placeholder="K o número"
                />
              </div>
              <div className="grid gap-2">
                <Label>Teléfono</Label>
                <Input
                  value={formNumeroContacto}
                  onChange={(e) => setFormNumeroContacto(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="grid gap-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Contraseña"
              />
            </div>

            <div className="grid gap-2">
              <Label>Dirección</Label>
              <Input
                value={formDireccion}
                onChange={(e) => setFormDireccion(e.target.value)}
                placeholder="Dirección completa"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isEmpresa"
                type="checkbox"
                checked={isEmpresa}
                onChange={(e) => setIsEmpresa(e.target.checked)}
              />
              <label htmlFor="isEmpresa" className="text-sm">
                Es empresa (agregar Razón Social y Giro)
              </label>
            </div>

            {isEmpresa && (
              <>
                <div className="grid gap-2">
                  <Label>Razón Social</Label>
                  <Input
                    value={formRazSocial}
                    onChange={(e) => setFormRazSocial(e.target.value)}
                    placeholder="Razón social"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Giro</Label>
                  <Input
                    value={formGiro}
                    onChange={(e) => setFormGiro(e.target.value)}
                    placeholder="Giro"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Región</Label>
                <Select
                  value={formRegion ? String(formRegion) : ""}
                  onValueChange={(v) => {
                    setFormRegion(v ? Number(v) : null);
                    setFormCiudad(null);
                  }}
                >
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
                <Label>Ciudad</Label>
                <Select
                  value={formCiudad ? String(formCiudad) : ""}
                  onValueChange={(v) => setFormCiudad(v ? Number(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Buscar ciudad..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-56 overflow-auto">
                      {filteredCiudades.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {createError && (
              <div className="text-sm text-destructive">{createError}</div>
            )}
            {successMsg && (
              <div className="text-sm text-success">{successMsg}</div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetForm} disabled={creating}>
                Limpiar
              </Button>
              <Button onClick={handleCrearCuenta} disabled={creating}>
                {creating ? "Creando..." : "Crear Cuenta"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
