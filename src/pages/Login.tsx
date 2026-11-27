import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginUsuario, solicitarRedefinicaoSenha } from "@/services/auth";
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    LockKeyhole,
    Mail,
    UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const token = await loginUsuario({ email: email.trim(), senha });
      if (!token) throw new Error("A API não retornou um token de acesso.");
      localStorage.setItem("@orca:token", token);
      navigate("/projetos", { replace: true });
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      setErrorMsg(
        status === 401
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Verifique a conexão com o servidor e tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) {
      setErrorMsg("Informe seu e-mail para solicitar a recuperação da senha.");
      return;
    }

    setRecuperandoSenha(true);
    try {
      await solicitarRedefinicaoSenha(email.trim());
      setSuccessMsg(
        "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.",
      );
    } catch {
      setErrorMsg(
        "Não foi possível solicitar a recuperação. Verifique a conexão com o servidor.",
      );
    } finally {
      setRecuperandoSenha(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ECF6F4] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-[12px] border border-[#C6D2D0] bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#31EA77] text-[#0F2940]">
            <UserRound size={24} strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#0F273D]">
            Entrar no ORCA
          </h1>
          <p className="mt-1 text-sm text-[#748598]">
            Acesse sua conta para continuar
          </p>
        </header>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-[#DF4F52]/40 bg-[#DF4F52]/10 px-3 py-2.5 text-sm text-[#DF4F52]"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-lg border border-[#2CE078]/60 bg-[#2CE078]/15 px-3 py-2.5 text-sm text-[#0F273D]"
          >
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            id="login-email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            icon={<Mail size={16} strokeWidth={1.75} />}
            className="pl-9"
            required
          />
          <div className="relative">
            <Input
              id="login-senha"
              label="Senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              icon={<LockKeyhole size={16} strokeWidth={1.75} />}
              className="pl-9 pr-10"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((value) => !value)}
              className="absolute right-3 top-[29px] text-[#748598] hover:text-[#0F273D]"
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={recuperandoSenha}
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0F273D] hover:underline disabled:opacity-60"
            >
              <KeyRound size={14} />
              {recuperandoSenha
                ? "Enviando solicitação..."
                : "Esqueci minha senha"}
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#748598]">
          Ainda não tem conta?{" "}
          <Link
            to="/cadastro"
            className="font-medium text-[#0F273D] hover:underline"
          >
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
