import axios from 'axios';

export interface ProjetoResDto {
  id: number;
  nome: string;
  descricao: string;
  financiador: string;
  valor: number;
  dataInicio: string; // ISO YYYY-MM-DD
  dataFim: string; // ISO YYYY-MM-DD
  orcamentoId: number;
  usuarioId: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@orca:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Busca a lista paginada de projetos do usuário autenticado em GET /v1/projetos.
 */
export async function listarProjetos(token?: string): Promise<PageResponse<ProjetoResDto>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await api.get<PageResponse<ProjetoResDto>>('/v1/projetos', {
    params: { size: 50, sort: 'nome,asc' },
    headers,
  });

  return response.data;
}

export type StatusProjeto = 'INICIANDO' | 'EM_EXECUCAO' | 'PAUSADO' | 'ENCERRADO';

export interface ProjetoReqDto {
  nome: string;
  descricao: string;
  financiador: string;
  valor: number;
  dataInicio: string; // ISO YYYY-MM-DD
  dataFim: string; // ISO YYYY-MM-DD
  statusProjeto: StatusProjeto;
}

export interface UsuarioResumoDto {
  id: number;
  nome: string;
  email: string;
}

export type TipoItemOrcamento = 'COMPOSITE' | 'LEAF';

export interface ItemOrcamentoReqDto {
  rubrica: string;
  descricao: string;
  tipoItem: TipoItemOrcamento;
  valorPrevisto: number | null;
  parentId: number | null;
}

export interface ItemOrcamentoResDto {
  idOrcamento: number;
  rubrica: string;
  descricao: string;
  tipoItem: TipoItemOrcamento;
  valorPrevisto: number;
  valorExecutado: number;
  valorDisponivel: number;
  parentId: number | null;
}

export async function buscarProjetoPorId(id: string | number): Promise<ProjetoResDto> {
  const response = await api.get<ProjetoResDto>(`/v1/projetos/${id}`);
  return response.data;
}

export async function cadastrarProjeto(dto: ProjetoReqDto): Promise<void> {
  await api.post('/v1/projetos/cadastro', dto);
}

export async function atualizarProjeto(
  id: string | number,
  dto: ProjetoReqDto
): Promise<ProjetoResDto> {
  const response = await api.put<ProjetoResDto>(`/v1/projetos/${id}/atualizar`, dto);
  return response.data;
}

export async function listarUsuarios(): Promise<UsuarioResumoDto[]> {
  const response = await api.get<UsuarioResumoDto[]>('/v1/usuarios');
  return response.data;
}

export async function criarItemOrcamento(
  idProjeto: number | string,
  dto: ItemOrcamentoReqDto
): Promise<ItemOrcamentoResDto> {
  const response = await api.post<ItemOrcamentoResDto>(
    `/v1/projetos/${idProjeto}/itens-orcamento`,
    dto
  );
  return response.data;
}

