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
