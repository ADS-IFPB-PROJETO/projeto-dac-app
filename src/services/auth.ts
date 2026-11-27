import { api } from "./api";

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface SignupRequest {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
}

export async function loginUsuario(dto: LoginRequest): Promise<string> {
  const response = await api.post<string>("/v1/auth/login", dto);
  return String(response.data).trim().replace(/^"|"$/g, "");
}

export async function cadastrarUsuario(dto: SignupRequest): Promise<void> {
  await api.post("/v1/auth/signup", dto);
}

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  await api.post("/v1/auth/recuperar-senha", { email });
}
