import { PapelProjeto, ProjetoResDto, VinculoResponseDto } from '@/services/api';

export interface ProjectPermissions {
  papel: PapelProjeto;
  papelLabel: string;
  canManageProject: boolean; // Editar/deletar projeto, gerenciar membros
  canManageBudget: boolean; // Criar, editar e excluir rubricas/itens do orçamento
  canLaunchFinancials: boolean; // Lançar despesas, remessas, empréstimos e devoluções
  canView: boolean; // Visualizar dashboard, listas e exportar PDF
}

const PAPEL_LABELS: Record<PapelProjeto, string> = {
  OWNER: 'Coordenador (OWNER)',
  MEMBER: 'Membro (MEMBER)',
  VIEWER: 'Observador (VIEWER)',
};

interface JwtClaims {
  sub?: string;
  id?: number;
  userId?: number;
  email?: string;
}

function decodeJwtPayload(token: string | null): JwtClaims | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/**
 * Resolve o papel do usuário autenticado dentro do projeto a partir do JWT e da lista de membros.
 * Em modo demonstração (sem token), assume OWNER para permitir testes locais.
 */
export function resolveUserRoleInProject(
  membros: VinculoResponseDto[],
  projeto?: ProjetoResDto | null
): PapelProjeto {
  const token = typeof window !== 'undefined' ? localStorage.getItem('@orca:token') : null;
  const claims = decodeJwtPayload(token);

  if (!claims) {
    return 'OWNER';
  }

  const claimId = claims.id ?? claims.userId;
  const claimEmail = claims.email ?? claims.sub;

  const match = membros.find((m) => {
    if (claimId !== undefined && Number(m.usuarioId) === Number(claimId)) return true;
    if (claimEmail && m.email.toLowerCase() === claimEmail.toLowerCase()) return true;
    return false;
  });

  if (match) {
    return match.papel;
  }

  if (projeto && claimId !== undefined && Number(projeto.usuarioId) === Number(claimId)) {
    return 'OWNER';
  }

  return 'VIEWER';
}

/**
 * Mapeia as permissões de cada papel no projeto conforme regras do back-end ORCA.
 * - OWNER: controle total (projeto, membros, orçamento/rubricas e lançamentos financeiros).
 * - MEMBER: pode lançar despesas, remessas, empréstimos e devoluções; não gerencia membros/orçamento.
 * - VIEWER: acesso somente leitura (visualização e exportação de relatório PDF).
 */
export function getProjectPermissions(papel: PapelProjeto): ProjectPermissions {
  return {
    papel,
    papelLabel: PAPEL_LABELS[papel],
    canManageProject: papel === 'OWNER',
    canManageBudget: papel === 'OWNER',
    canLaunchFinancials: papel === 'OWNER' || papel === 'MEMBER',
    canView: true,
  };
}
