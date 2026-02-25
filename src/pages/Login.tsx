

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import logoSinFondo from "@/images/logoSinFondo.png";

// Formato RUT como en Registro.tsx
function formatRutEmpresa(input: string): string {
  let value = input.toUpperCase().replace(/[^0-9K]/g, "");
  let digits = value.replace(/K/g, "");
  if (digits.length > 9) digits = digits.slice(0, 9);
  let formatted = digits;
  if (value.includes("K")) {
    const numPart = digits.slice(0, 8);
    formatted = `${numPart}-K`;
  } else if (digits.length === 9) {
    formatted = `${digits.slice(0, 8)}-${digits[8]}`;
  } else if (digits.length === 8) {
    formatted = `${digits.slice(0, 7)}-${digits[7]}`;
  }
  return formatted;
}

export default function Login() {

  const [rutEmpresa, setRutEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Validar rutEmpresa
    const rutEmpresaFormatted = formatRutEmpresa(rutEmpresa);
    if (!rutEmpresaFormatted || rutEmpresaFormatted.length < 8) {
      setError("RUT de empresa inválido");
      setLoading(false);
      return;
    }
    // Buscar empresa por rut y origen
    const { data: empresaData, error: empresaError } = await supabase
      .from("empresa")
      .select("id")
      .eq("rutEmpresa", rutEmpresaFormatted)
      .eq("origen", "Benefiat")
      .maybeSingle();
    if (empresaError || !empresaData?.id) {
      setError("Empresa no encontrada o RUT incorrecto");
      setLoading(false);
      return;
    }
    // Transformar el correo: usuario+74+idEmpresa@dominio
    const atIdx = email.indexOf("@");
    let emailLogin = email;
    if (atIdx > 0) {
      const user = email.slice(0, atIdx);
      const domain = email.slice(atIdx);
      emailLogin = user  + empresaData.id + domain;
    }
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: emailLogin, password });
    if (loginError) {
      setError(loginError.message);
    } else {
      sessionStorage.setItem("sucursal_modal_pending", "1");
      localStorage.setItem("session_started_at", String(Date.now()));
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FBFC]">
      <form
        onSubmit={handleLogin}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-[#6EDCF8]/40"
      >
        <div className="flex flex-col items-center mb-6">
          <img src={logoSinFondo} alt="Logo" className="w-16 h-16 mb-2 object-contain" />
          <h1 className="text-2xl font-bold text-[#00679F]">Iniciar Sesión</h1>
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-[#00679F] font-semibold">RUT de empresa</label>
          <input
            type="text"
            value={rutEmpresa}
            onChange={e => setRutEmpresa(formatRutEmpresa(e.target.value))}
            placeholder="Ej: 76XXXXXX-K"
            className="border-2 border-[#6EDCF8] focus:border-[#00679F] rounded-lg p-3 w-full text-lg transition bg-white mb-3"
            required
          />
          <label className="block mb-1 text-[#00679F] font-semibold">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="border-2 border-[#6EDCF8] focus:border-[#00679F] rounded-lg p-3 w-full text-lg transition bg-white"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-[#00679F] font-semibold">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="border-2 border-[#6EDCF8] focus:border-[#00679F] rounded-lg p-3 w-full text-lg transition bg-white"
            required
          />
        </div>
        {error && <div className="mb-4 text-red-600 text-center font-semibold">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#00679F] hover:bg-[#005377] text-white px-6 py-3 rounded-lg w-full text-lg font-bold shadow transition disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}