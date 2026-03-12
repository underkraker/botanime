"use client";

import { FormEvent, useMemo, useState } from "react";

type Mode = "login" | "register";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "user" | "admin";
  };
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = useMemo(() => `${apiBase}/auth/${mode}`, [mode]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload =
        mode === "register"
          ? { email, password, displayName }
          : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as { message?: string | string[] };
        const errorMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join(", ")
          : errorBody.message ?? "No se pudo completar la autenticacion";
        throw new Error(errorMessage);
      }

      const auth = (await response.json()) as AuthResponse;
      localStorage.setItem("accessToken", auth.accessToken);
      localStorage.setItem("refreshToken", auth.refreshToken);
      localStorage.setItem("userRole", auth.user.role);
      setMessage(`Bienvenido ${auth.user.displayName}. Sesion iniciada correctamente.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#124f6c,#081626_50%,#060c16)] px-4 py-10 text-brand-cream sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-5xl gap-6 rounded-3xl border border-white/15 bg-white/5 p-4 shadow-glow backdrop-blur-sm sm:p-8 lg:grid-cols-[1.1fr_1fr]">
        <article className="space-y-4 rounded-2xl bg-black/20 p-4 sm:p-6">
          <p className="inline-flex rounded-full bg-brand-amber/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-amber">
            Cuenta segura
          </p>
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">
            Crea tu acceso y continua viendo desde cualquier dispositivo
          </h1>
          <p className="text-sm text-brand-cream/85 sm:text-base">
            Ya dejamos listo registro, login y refresh token en la API para manejar
            sesiones persistentes entre movil, tablet y escritorio.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            <span className="rounded-xl border border-white/20 px-2 py-2">JWT</span>
            <span className="rounded-xl border border-white/20 px-2 py-2">Refresh</span>
            <span className="rounded-xl border border-white/20 px-2 py-2">PostgreSQL</span>
          </div>
        </article>

        <article className="rounded-2xl bg-brand-navy/70 p-4 sm:p-6">
          <div className="mb-4 grid grid-cols-2 rounded-full bg-white/10 p-1 text-sm">
            <button
              className={`rounded-full px-4 py-2 ${
                mode === "register" ? "bg-brand-amber text-[#261a08]" : "text-brand-cream/80"
              }`}
              onClick={() => setMode("register")}
              type="button"
            >
              Registro
            </button>
            <button
              className={`rounded-full px-4 py-2 ${
                mode === "login" ? "bg-brand-amber text-[#261a08]" : "text-brand-cream/80"
              }`}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            {mode === "register" ? (
              <label className="block text-sm">
                Nombre visible
                <input
                  className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-brand-cream outline-none ring-brand-sky transition focus:ring-2"
                  minLength={2}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  value={displayName}
                />
              </label>
            ) : null}

            <label className="block text-sm">
              Email
              <input
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-brand-cream outline-none ring-brand-sky transition focus:ring-2"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block text-sm">
              Contrasena
              <input
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-brand-cream outline-none ring-brand-sky transition focus:ring-2"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            <button
              className="mt-2 w-full rounded-xl bg-brand-amber px-4 py-2 text-sm font-semibold text-[#261a08] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Entrar"}
            </button>
          </form>

          {message ? <p className="mt-4 text-sm text-brand-cream/90">{message}</p> : null}
        </article>
      </section>
    </main>
  );
}
