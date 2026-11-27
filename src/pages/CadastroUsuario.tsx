import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cadastrarUsuario } from "@/services/auth";
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function CadastroUsuario() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nome.trim()) return setErrorMsg("Informe seu nome.");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return setErrorMsg("Informe um e-mail válido.");
    if (!cpf.trim()) return setErrorMsg("Informe seu CPF.");
    if (senha.length < 8 || senha.length > 16)
      return setErrorMsg("A senha deve ter entre 8 e 16 caracteres.");
    if (senha !== confirmacaoSenha)
      return setErrorMsg("A confirmação de senha não corresponde à senha.");

    setSubmitting(true);
    try {
      await cadastrarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        cpf: cpf.replace(/\D/g, ""),
      });
      setSuccessMsg("Conta criada com sucesso! Agora você pode entrar.");
      setNome("");
      setEmail("");
      setCpf("");
      setSenha("");
      setConfirmacaoSenha("");
    } catch (error: unknown) {
      const response =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response
          : undefined;
      if (!response)
        setErrorMsg(
          "Não foi possível acessar o backend. Tente novamente quando ele estiver disponível.",
        );
      else if (response.status === 409)
        setErrorMsg("Este e-mail já está cadastrado.");
      else if (response.status === 400)
        setErrorMsg(
          "Dados inválidos. Confira o nome, e-mail, CPF e senha (8 a 16 caracteres).",
        );
      else setErrorMsg("Não foi possível criar sua conta. Tente novamente.");
    } finally {
      setSubmitting(false);
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
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-[#748598]">
            Cadastre-se para acessar o ORCA
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="cadastro-nome"
            label="Nome"
            type="text"
            autoComplete="name"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            icon={<UserRound size={16} />}
            className="pl-9"
            required
            maxLength={120}
          />
          <Input
            id="cadastro-email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            icon={<Mail size={16} />}
            className="pl-9"
            required
          />
          <Input
            id="cadastro-cpf"
            label="CPF"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Somente números"
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
            icon={<UserRound size={16} />}
            className="pl-9"
            required
            maxLength={14}
          />
          <div className="relative">
            <Input
              id="cadastro-senha"
              label="Senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Entre 8 e 16 caracteres"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              icon={<LockKeyhole size={16} />}
              className="pl-9 pr-10"
              required
              minLength={8}
              maxLength={16}
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
          <div className="relative">
            <Input
              id="cadastro-confirmacao-senha"
              label="Confirmação de senha"
              type={mostrarConfirmacao ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repita sua senha"
              value={confirmacaoSenha}
              onChange={(event) => setConfirmacaoSenha(event.target.value)}
              icon={<LockKeyhole size={16} />}
              className="pl-9 pr-10"
              required
              minLength={8}
              maxLength={16}
            />
            <button
              type="button"
              onClick={() => setMostrarConfirmacao((value) => !value)}
              className="absolute right-3 top-[29px] text-[#748598] hover:text-[#0F273D]"
              aria-label={
                mostrarConfirmacao
                  ? "Ocultar confirmação"
                  : "Mostrar confirmação"
              }
            >
              {mostrarConfirmacao ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p className="text-xs text-[#748598]">
            Use uma senha de 8 a 16 caracteres.
          </p>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Criando conta..." : "Criar Conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#748598]">
          Já tenho uma conta?{" "}
          <Link
            to="/login"
            className="font-medium text-[#0F273D] hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
