import axios from "axios";

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

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:8443";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@orca:token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Busca a lista paginada de projetos do usuário autenticado em GET /v1/projetos.
 */
export async function listarProjetos(
  token?: string,
): Promise<PageResponse<ProjetoResDto>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await api.get<PageResponse<ProjetoResDto>>("/v1/projetos", {
    params: { size: 50, sort: "nome,asc" },
    headers,
  });

  return response.data;
}

export type StatusProjeto =
  | "INICIANDO"
  | "EM_EXECUCAO"
  | "PAUSADO"
  | "ENCERRADO";

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

export type TipoItemOrcamento = "COMPOSITE" | "LEAF";

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

export async function buscarProjetoPorId(
  id: string | number,
): Promise<ProjetoResDto> {
  const response = await api.get<ProjetoResDto>(`/v1/projetos/${id}`);
  return response.data;
}

export async function cadastrarProjeto(dto: ProjetoReqDto): Promise<void> {
  await api.post("/v1/projetos/cadastro", dto);
}

export async function atualizarProjeto(
  id: string | number,
  dto: ProjetoReqDto,
): Promise<ProjetoResDto> {
  const response = await api.put<ProjetoResDto>(
    `/v1/projetos/${id}/atualizar`,
    dto,
  );
  return response.data;
}

export async function listarUsuarios(): Promise<UsuarioResumoDto[]> {
  const response = await api.get<UsuarioResumoDto[]>("/v1/usuarios");
  return response.data;
}

export async function criarItemOrcamento(
  idProjeto: number | string,
  dto: ItemOrcamentoReqDto,
): Promise<ItemOrcamentoResDto> {
  const response = await api.post<ItemOrcamentoResDto>(
    `/v1/projetos/${idProjeto}/itens-orcamento`,
    dto,
  );
  return response.data;
}

export type PapelProjeto = "OWNER" | "VIEWER" | "MEMBER";

export interface VinculoResponseDto {
  id: number;
  projetoId: number;
  usuarioId: number;
  nome: string;
  email: string;
  papel: PapelProjeto;
  ativo: boolean;
  dataInicio: string;
}

export interface LancamentoDespesaResDto {
  id: number;
  idItemOrcamento: number;
  nomeRubrica: string;
  valorGasto: number;
  dataCompetencia: string;
  descricaoGasto: string;
  saldoRestanteRubrica: number;
}

export interface RemessaResDto {
  id: number;
  idProjeto: number;
  nomeProjeto: string;
  valor: number;
  dataRecebimento: string;
  identificacaoAporte: string;
  descricao: string;
  dataLancamento: string;
}

export type StatusEmprestimo = "PENDENTE" | "PARCIALMENTE_PAGO" | "QUITADO";

export interface EmprestimoResDto {
  id: number;
  idProjeto: number;
  valor: number;
  credor: string;
  dataVencimento: string;
  status: StatusEmprestimo;
  observacoes: string;
  descricao: string;
  dataLancamento: string;
}

export interface ExtratoEmprestimoResDto {
  totalRecebido: number;
  totalDevolvido: number;
  saldoDevedor: number;
  status: StatusEmprestimo;
}

export interface RelatorioPdfFiltroReq {
  dataInicio: string;
  dataFim: string;
  rubricasIds?: number[];
}

export async function listarItensOrcamento(
  idProjeto: number | string,
  size = 100,
): Promise<PageResponse<ItemOrcamentoResDto>> {
  const response = await api.get<PageResponse<ItemOrcamentoResDto>>(
    `/v1/projetos/${idProjeto}/itens-orcamento`,
    { params: { size } },
  );
  return response.data;
}

export async function listarMembrosProjeto(
  idProjeto: number | string,
): Promise<VinculoResponseDto[]> {
  const response = await api.get<VinculoResponseDto[]>(
    `/v1/projetos/${idProjeto}/membros`,
  );
  return response.data;
}

export async function desassociarMembroProjeto(
  idProjeto: number | string,
  idMembro: number | string,
): Promise<void> {
  await api.delete(`/v1/projetos/${idProjeto}/membros/${idMembro}`);
}

export async function listarDespesasProjeto(
  idProjeto: number | string,
): Promise<LancamentoDespesaResDto[]> {
  const response = await api.get<LancamentoDespesaResDto[]>(
    `/v1/despesas/projeto/${idProjeto}`,
  );
  return response.data;
}

export async function listarRemessasProjeto(
  idProjeto: number | string,
): Promise<RemessaResDto[]> {
  const response = await api.get<RemessaResDto[]>(
    `/v1/remessas/projeto/${idProjeto}`,
  );
  return response.data;
}

export async function listarEmprestimosProjeto(
  idProjeto: number | string,
): Promise<EmprestimoResDto[]> {
  const response = await api.get<EmprestimoResDto[]>(
    `/v1/emprestimos/projeto/${idProjeto}`,
  );
  return response.data;
}

export async function buscarExtratoEmprestimos(
  idProjeto: number | string,
): Promise<ExtratoEmprestimoResDto> {
  const response = await api.get<ExtratoEmprestimoResDto>(
    `/v1/emprestimos/projeto/${idProjeto}/extrato`,
  );
  return response.data;
}

export async function gerarRelatorioPdfProjeto(
  idProjeto: number | string,
  filtro: RelatorioPdfFiltroReq,
): Promise<Blob> {
  const response = await api.post<Blob>(
    `/v1/projetos/${idProjeto}/relatorio/pdf`,
    filtro,
    {
      responseType: "blob",
    },
  );
  return response.data;
}

export async function atualizarItemOrcamento(
  idOrcamento: number | string,
  dto: ItemOrcamentoReqDto,
): Promise<ItemOrcamentoResDto> {
  const response = await api.put<ItemOrcamentoResDto>(
    `/v1/itens-orcamento/${idOrcamento}`,
    dto,
  );
  return response.data;
}

export async function deletarItemOrcamento(
  idOrcamento: number | string,
): Promise<void> {
  await api.delete(`/v1/itens-orcamento/${idOrcamento}`);
}

export interface LancamentoDespesaReqDto {
  idItemOrcamento: number;
  valorGasto: number;
  dataCompetencia: string; // ISO YYYY-MM-DD
  descricaoGasto: string;
}

export async function registrarDespesa(
  dto: LancamentoDespesaReqDto,
): Promise<LancamentoDespesaResDto> {
  const response = await api.post<LancamentoDespesaResDto>("/v1/despesas", dto);
  return response.data;
}

export interface RemessaReqDto {
  idProjeto: number;
  valor: number;
  dataRecebimento: string; // ISO YYYY-MM-DD
  identificacaoAporte: string;
  descricao?: string;
}

export async function registrarRemessa(
  dto: RemessaReqDto,
): Promise<RemessaResDto> {
  const response = await api.post<RemessaResDto>("/v1/remessas", dto);
  return response.data;
}

export interface EmprestimoReqDto {
  idProjeto: number;
  valor: number;
  dataVencimento: string; // ISO YYYY-MM-DD
  credor: string;
  observacoes?: string;
  descricao?: string;
}

export async function registrarEmprestimo(
  dto: EmprestimoReqDto,
): Promise<EmprestimoResDto> {
  const response = await api.post<EmprestimoResDto>("/v1/emprestimos", dto);
  return response.data;
}

export interface DevolucaoReqDto {
  valor: number;
  dataDevolucao: string; // ISO YYYY-MM-DD
  descricao?: string;
}

export interface DevolucaoResDto {
  id: number;
  idEmprestimo: number;
  valor: number;
  dataDevolucao: string;
  descricao: string;
}

export async function registrarDevolucao(
  idEmprestimo: number | string,
  dto: DevolucaoReqDto,
): Promise<DevolucaoResDto> {
  const response = await api.post<DevolucaoResDto>(
    `/v1/emprestimos/${idEmprestimo}/devolver`,
    dto,
  );
  return response.data;
}

export interface CadastrarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
}

export async function cadastrarUsuario(
  dto: CadastrarUsuarioRequest,
): Promise<void> {
  await api.post("/v1/auth/signup", dto);
}
