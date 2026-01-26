

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import logoSinFondo from "@/images/logoSinFondo.png";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Transformar el correo: usuario+74@dominio
    const atIdx = email.indexOf("@");
    let emailLogin = email;
    if (atIdx > 0) {
      const user = email.slice(0, atIdx);
      const domain = email.slice(atIdx);
      emailLogin = user + "74" + domain;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password });
    if (error) setError(error.message);
    else navigate("/");
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
          <label className="block mb-1 text-[#00679F] font-semibold">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
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