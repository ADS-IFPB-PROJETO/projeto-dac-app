import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  CircleDollarSign,
  FileDown,
  Layers,
  Plus,
  Receipt,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KpiCard, KpiTone } from '@/components/dashboard/KpiCard';
import { DonutChart, DonutSlice } from '@/components/dashboard/DonutChart';
import { EquipeCard } from '@/components/dashboard/EquipeCard';
import { MovimentacaoItem, MovimentacoesCard } from '@/components/dashboard/MovimentacoesCard';
import {
  buscarExtratoEmprestimos,
  buscarProjetoPorId,
  desassociarMembroProjeto,
  EmprestimoResDto,
  ExtratoEmprestimoResDto,
  gerarRelatorioPdfProjeto,
  ItemOrcamentoResDto,
  LancamentoDespesaResDto,
  listarDespesasProjeto,
  listarEmprestimosProjeto,
  listarItensOrcamento,
  listarMembrosProjeto,
  listarRemessasProjeto,
  ProjetoResDto,
  RemessaResDto,
  VinculoResponseDto,
} from '@/services/api';
import { formatCurrencyBRL, formatVigencia } from '@/utils/formatters';
import { getProjectPermissions, resolveUserRoleInProject } from '@/utils/permissions';

const MOCK_PROJETO: ProjetoResDto = {
  id: 1,
  nome: 'Edital PIBIC 2026 - Laboratório de Dados',
  descricao:
    'Execução de bolsas de iniciação científica, aquisição de equipamentos e custeio de pesquisa aplicada.',
  financiador: 'CNPq / IFPB',
  valor: 150000,
  dataInicio: '2026-01-15',
  dataFim: '2026-12-20',
  orcamentoId: 10,
  usuarioId: 1,
};

const MOCK_ITENS: ItemOrcamentoResDto[] = [
  {
    idOrcamento: 101,
    rubrica: '33.90.30 - Material de Consumo',
    descricao: 'Insumos de laboratório e periféricos',
    tipoItem: 'LEAF',
    valorPrevisto: 45000,
    valorExecutado: 38200,
    valorDisponivel: 6800,
    parentId: null,
  },
  {
    idOrcamento: 102,
    rubrica: '33.90.18 - Bolsas de Pesquisa',
    descricao: 'Bolsas de iniciação científica (12 meses)',
    tipoItem: 'LEAF',
    valorPrevisto: 65000,
    valorExecutado: 32500,
    valorDisponivel: 32500,
    parentId: null,
  },
  {
    idOrcamento: 103,
    rubrica: '44.90.52 - Equipamentos',
    descricao: 'Servidores e estações de trabalho',
    tipoItem: 'LEAF',
    valorPrevisto: 40000,
    valorExecutado: 42500,
    valorDisponivel: -2500,
    parentId: null,
  },
];

const MOCK_MEMBROS: VinculoResponseDto[] = [
  {
    id: 1,
    projetoId: 1,
    usuarioId: 1,
    nome: 'João Silva',
    email: 'joao.silva@ifpb.edu.br',
    papel: 'OWNER',
    ativo: true,
    dataInicio: '2026-01-15',
  },
  {
    id: 2,
    projetoId: 1,
    usuarioId: 2,
    nome: 'Maria Almeida',
    email: 'maria.almeida@ifpb.edu.br',
    papel: 'MEMBER',
    ativo: true,
    dataInicio: '2026-01-20',
  },
  {
    id: 3,
    projetoId: 1,
    usuarioId: 3,
    nome: 'Lucas Costa',
    email: 'lucas.costa@ifpb.edu.br',
    papel: 'VIEWER',
    ativo: true,
    dataInicio: '2026-02-01',
  },
];

const MOCK_DESPESAS: LancamentoDespesaResDto[] = [
  {
    id: 1,
    idItemOrcamento: 103,
    nomeRubrica: '44.90.52 - Equipamentos',
    valorGasto: 42500,
    dataCompetencia: '2026-11-10',
    descricaoGasto: 'Aquisição de estação de trabalho GPU',
    saldoRestanteRubrica: -2500,
  },
  {
    id: 2,
    idItemOrcamento: 101,
    nomeRubrica: '33.90.30 - Material de Consumo',
    valorGasto: 18200,
    dataCompetencia: '2026-10-22',
    descricaoGasto: 'Compra de kits de sensores e cabos',
    saldoRestanteRubrica: 6800,
  },
];

const MOCK_REMESSAS: RemessaResDto[] = [
  {
    id: 1,
    idProjeto: 1,
    nomeProjeto: 'Edital PIBIC 2026 - Laboratório de Dados',
    valor: 25000,
    dataRecebimento: '2026-11-02',
    identificacaoAporte: 'Aporte Complementar CNPq',
    descricao: 'Liberação da 2ª parcela de custeio',
    dataLancamento: '2026-11-02',
  },
];

const MOCK_EMPRESTIMOS: EmprestimoResDto[] = [
  {
    id: 1,
    idProjeto: 1,
    valor: 12000,
    credor: 'Fundo Institucional IFPB',
    dataVencimento: '2026-12-30',
    status: 'PARCIALMENTE_PAGO',
    observacoes: 'Adiantamento para compra de servidor',
    descricao: 'Empréstimo ponte para equipamento',
    dataLancamento: '2026-10-05',
  },
];

const MOCK_EXTRATO: ExtratoEmprestimoResDto = {
  totalRecebido: 12000,
  totalDevolvido: 4000,
  saldoDevedor: 8000,
  status: 'PARCIALMENTE_PAGO',
};

function getProjectHealthBadge(
  dataFim: string | undefined,
  saldoDisponivel: number,
  orcamentoTotal: number
): { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (saldoDisponivel < 0) {
    return { label: 'Orçamento Estourado', variant: 'danger' };
  }
  const hoje = new Date().toISOString().slice(0, 10);
  if (dataFim && dataFim < hoje) {
    return { label: 'Encerrado', variant: 'neutral' };
  }
  if (orcamentoTotal > 0 && saldoDisponivel / orcamentoTotal <= 0.15) {
    return { label: 'Em Atenção', variant: 'warning' };
  }
  return { label: 'Ativo · No Prazo', variant: 'success' };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 bg-white border border-[#C6D2D0] rounded-xl p-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white border border-[#C6D2D0] rounded-xl p-5" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-72 bg-white border border-[#C6D2D0] rounded-xl p-5" />
        ))}
      </div>
    </div>
  );
}

/**
 * T05 - Dashboard do Projeto (/projetos/:id)
 */
export function DashboardProjeto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [projeto, setProjeto] = useState<ProjetoResDto | null>(null);
  const [itens, setItens] = useState<ItemOrcamentoResDto[]>([]);
  const [membros, setMembros] = useState<VinculoResponseDto[]>([]);
  const [despesas, setDespesas] = useState<LancamentoDespesaResDto[]>([]);
  const [remessas, setRemessas] = useState<RemessaResDto[]>([]);
  const [emprestimos, setEmprestimos] = useState<EmprestimoResDto[]>([]);
  const [extrato, setExtrato] = useState<ExtratoEmprestimoResDto | null>(null);

  const carregarDashboard = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFeedbackError(null);
    setUsingMock(false);

    const results = await Promise.allSettled([
      buscarProjetoPorId(id),
      listarItensOrcamento(id, 100),
      listarMembrosProjeto(id),
      listarDespesasProjeto(id),
      listarRemessasProjeto(id),
      listarEmprestimosProjeto(id),
      buscarExtratoEmprestimos(id),
    ]);

    const projetoResult = results[0];

    if (projetoResult.status === 'fulfilled') {
      setProjeto(projetoResult.value);
      setItens(results[1].status === 'fulfilled' ? results[1].value.content ?? [] : []);
      setMembros(results[2].status === 'fulfilled' ? results[2].value : []);
      setDespesas(results[3].status === 'fulfilled' ? results[3].value : []);
      setRemessas(results[4].status === 'fulfilled' ? results[4].value : []);
      setEmprestimos(results[5].status === 'fulfilled' ? results[5].value : []);
      setExtrato(results[6].status === 'fulfilled' ? results[6].value : null);
    } else {
      setUsingMock(true);
      setProjeto({ ...MOCK_PROJETO, id: Number(id) || 1 });
      setItens(MOCK_ITENS);
      setMembros(MOCK_MEMBROS);
      setDespesas(MOCK_DESPESAS);
      setRemessas(MOCK_REMESSAS);
      setEmprestimos(MOCK_EMPRESTIMOS);
      setExtrato(MOCK_EXTRATO);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  // Cálculos financeiros consolidados
  const metrics = useMemo(() => {
    const orcamentoPrevisto = projeto?.valor ?? 0;

    const leafItens = itens.filter((item) => item.tipoItem === 'LEAF');
    const baseItens = leafItens.length > 0 ? leafItens : itens;

    const totalDespesasLista = despesas.reduce((acc, d) => acc + (d.valorGasto || 0), 0);
    const totalExecutadoItens = baseItens.reduce((acc, i) => acc + (i.valorExecutado || 0), 0);
    const totalExecutado =
      totalDespesasLista > 0 ? totalDespesasLista : totalExecutadoItens;

    const totalRemessas = remessas.reduce((acc, r) => acc + (r.valor || 0), 0);
    const totalEmprestimosRecebidos =
      extrato?.totalRecebido ?? emprestimos.reduce((acc, e) => acc + (e.valor || 0), 0);
    const totalEmprestimosDevolvidos = extrato?.totalDevolvido ?? 0;
    const saldoDevedorEmprestimos =
      extrato?.saldoDevedor ?? Math.max(0, totalEmprestimosRecebidos - totalEmprestimosDevolvidos);

    const saldoDisponivel =
      orcamentoPrevisto +
      totalRemessas +
      totalEmprestimosRecebidos -
      totalExecutado -
      totalEmprestimosDevolvidos;

    return {
      orcamentoPrevisto,
      totalExecutado,
      totalRemessas,
      totalEmprestimosRecebidos,
      totalEmprestimosDevolvidos,
      saldoDevedorEmprestimos,
      saldoDisponivel,
      baseItens,
    };
  }, [projeto, itens, despesas, remessas, emprestimos, extrato]);

  // Dados do Gráfico 1: Execução Orçamentária por Status / Rubrica
  const execucaoSlices: DonutSlice[] = useMemo(() => {
    let executadoNoPrazo = 0;
    let comprometidoAlerta = 0;
    let estourado = 0;
    let disponivel = 0;

    if (metrics.baseItens.length > 0) {
      for (const item of metrics.baseItens) {
        const previsto = item.valorPrevisto || 0;
        const executado = item.valorExecutado || 0;

        if (executado > previsto) {
          executadoNoPrazo += previsto;
          estourado += executado - previsto;
        } else {
          const uso = previsto > 0 ? executado / previsto : 0;
          if (uso >= 0.8) {
            comprometidoAlerta += executado;
          } else {
            executadoNoPrazo += executado;
          }
          disponivel += Math.max(0, previsto - executado);
        }
      }
    } else if (metrics.orcamentoPrevisto > 0) {
      const exec = Math.min(metrics.totalExecutado, metrics.orcamentoPrevisto);
      const exc = Math.max(0, metrics.totalExecutado - metrics.orcamentoPrevisto);
      executadoNoPrazo = exec;
      estourado = exc;
      disponivel = Math.max(0, metrics.orcamentoPrevisto - exec);
    }

    return [
      { id: 'executado', label: 'Executado (No prazo)', value: executadoNoPrazo, color: '#2CE078' },
      { id: 'alerta', label: 'Comprometido (≥ 80%)', value: comprometidoAlerta, color: '#DDA64B' },
      { id: 'estourado', label: 'Estourado', value: estourado, color: '#DF4F52' },
      { id: 'disponivel', label: 'Disponível', value: disponivel, color: '#C6D2D0' },
    ];
  }, [metrics]);

  // Dados do Gráfico 2: Distribuição de Movimentações (Entradas vs. Saídas)
  const movimentacaoSlices: DonutSlice[] = useMemo(() => {
    return [
      {
        id: 'orcamento',
        label: 'Orçamento Base',
        value: metrics.orcamentoPrevisto,
        color: '#0F273D',
      },
      {
        id: 'remessas',
        label: 'Remessas / Aportes',
        value: metrics.totalRemessas,
        color: '#2CE078',
      },
      {
        id: 'emprestimos',
        label: 'Empréstimos Recebidos',
        value: metrics.totalEmprestimosRecebidos,
        color: '#DDA64B',
      },
      {
        id: 'saidas',
        label: 'Despesas Executadas',
        value: metrics.totalExecutado,
        color: '#DF4F52',
      },
    ];
  }, [metrics]);

  // Lista unificada de movimentações para o Card 4
  const movimentacoesUnificadas: MovimentacaoItem[] = useMemo(() => {
    const items: MovimentacaoItem[] = [];

    for (const d of despesas) {
      items.push({
        id: `despesa-${d.id}`,
        tipo: 'DESPESA',
        data: d.dataCompetencia,
        descricao: d.descricaoGasto || 'Lançamento de despesa',
        origemOuRubrica: d.nomeRubrica || 'Rubrica',
        valor: d.valorGasto,
        ehEntrada: false,
      });
    }

    for (const r of remessas) {
      items.push({
        id: `remessa-${r.id}`,
        tipo: 'REMESSA',
        data: r.dataRecebimento || r.dataLancamento,
        descricao: r.descricao || r.identificacaoAporte || 'Remessa recebida',
        origemOuRubrica: r.identificacaoAporte || 'Aporte',
        valor: r.valor,
        ehEntrada: true,
      });
    }

    for (const e of emprestimos) {
      items.push({
        id: `emprestimo-${e.id}`,
        tipo: 'EMPRESTIMO',
        data: e.dataLancamento || e.dataVencimento,
        descricao: e.descricao || `Empréstimo — ${e.credor}`,
        origemOuRubrica: e.credor || 'Credor',
        valor: e.valor,
        ehEntrada: true,
      });
    }

    return items;
  }, [despesas, remessas, emprestimos]);

  async function handleExportPdf() {
    if (!id || !projeto) return;
    setExportingPdf(true);
    setFeedbackError(null);
    try {
      const hoje = new Date().toISOString().slice(0, 10);
      const blob = await gerarRelatorioPdfProjeto(id, {
        dataInicio: projeto.dataInicio || '2026-01-01',
        dataFim: projeto.dataFim || hoje,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-projeto-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setFeedbackError(
        'Não foi possível gerar o PDF agora. Verifique se o back-end está ativo e autenticado.'
      );
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleRemoveMember(idMembro: number) {
    if (!id) return;
    if (usingMock) {
      setMembros((prev) => prev.filter((m) => m.usuarioId !== idMembro));
      return;
    }
    try {
      await desassociarMembroProjeto(id, idMembro);
      setMembros((prev) => prev.filter((m) => m.usuarioId !== idMembro));
    } catch {
      setFeedbackError('Erro ao desassociar membro do projeto.');
    }
  }

  const role = useMemo(() => resolveUserRoleInProject(membros, projeto), [membros, projeto]);
  const permissions = useMemo(() => getProjectPermissions(role), [role]);

  const saldoTone: KpiTone = useMemo(() => {
    if (metrics.saldoDisponivel < 0) return 'danger';
    if (
      metrics.orcamentoPrevisto > 0 &&
      metrics.saldoDisponivel / metrics.orcamentoPrevisto <= 0.15
    ) {
      return 'warning';
    }
    return 'success';
  }, [metrics]);

  const healthBadge = getProjectHealthBadge(
    projeto?.dataFim,
    metrics.saldoDisponivel,
    metrics.orcamentoPrevisto
  );

  const percentualExecucao =
    metrics.orcamentoPrevisto > 0
      ? ((metrics.totalExecutado / metrics.orcamentoPrevisto) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="min-h-screen bg-[#ECF6F4] flex flex-col">
      <Topbar userName="João Silva" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Aviso de modo demonstração (quando back-end não responde) */}
        {usingMock && (
          <div className="mb-5 bg-[#DDA64B]/15 border border-[#DDA64B]/50 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-[#0F273D]">
              <AlertCircle size={18} className="text-[#DDA64B] shrink-0" />
              <span>
                Exibindo dados de demonstração. Conecte-se ao back-end para visualizar os dados
                reais do projeto.
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<RefreshCw size={14} />}
              onClick={carregarDashboard}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {feedbackError && (
          <div className="mb-5 bg-[#DF4F52]/10 border border-[#DF4F52]/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-sm text-[#DF4F52]">
            <div className="flex items-center gap-2">
              <AlertCircle size={17} className="shrink-0" />
              <span>{feedbackError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackError(null)}
              className="text-xs font-semibold underline"
            >
              Fechar
            </button>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-6">
            {/* 3.1. Cabeçalho do Projeto e Ações Principais */}
            <header className="bg-white border border-[#C6D2D0] rounded-xl p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => navigate('/projetos')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#748598] hover:text-[#0F273D] transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} strokeWidth={1.75} />
                    Projetos
                  </button>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#0F273D] font-display">
                      {projeto?.nome ?? `Projeto #${id}`}
                    </h1>
                    <Badge variant={healthBadge.variant}>{healthBadge.label}</Badge>
                    <Badge variant="neutral">{permissions.papelLabel}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#748598]">
                    {projeto?.financiador && (
                      <span>
                        Financiador:{' '}
                        <strong className="font-medium text-[#0F273D]">
                          {projeto.financiador}
                        </strong>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Calendar size={14} strokeWidth={1.75} />
                      {formatVigencia(projeto?.dataInicio, projeto?.dataFim)}
                    </span>
                  </div>
                </div>

                {/* Barra de Ações Rápidas */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<FileDown size={16} strokeWidth={1.75} />}
                    disabled={exportingPdf}
                    onClick={handleExportPdf}
                  >
                    {exportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Layers size={16} strokeWidth={1.75} />}
                    onClick={() => navigate(`/projetos/${id}/orcamento`)}
                  >
                    {permissions.canManageBudget ? '+ Orçamento / Rubricas' : 'Ver Orçamento'}
                  </Button>

                  {permissions.canLaunchFinancials && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<ArrowLeftRight size={16} strokeWidth={1.75} />}
                        onClick={() => navigate(`/projetos/${id}/emprestimos`)}
                      >
                        + Empréstimo
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={16} strokeWidth={1.75} />}
                        onClick={() => navigate(`/projetos/${id}/movimentacoes/nova`)}
                      >
                        Despesa / Entrada
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* 3.2. Cards de Resumo Financeiro (KPIs) */}
            <section
              aria-label="Resumo financeiro do projeto"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <KpiCard
                label="Orçamento Total Previsto"
                value={formatCurrencyBRL(metrics.orcamentoPrevisto)}
                subtitle={`${metrics.baseItens.length} rubrica(s) cadastrada(s)`}
                icon={<CircleDollarSign size={18} strokeWidth={1.75} />}
                tone="neutral"
              />

              <KpiCard
                label="Total Executado / Despesas"
                value={formatCurrencyBRL(metrics.totalExecutado)}
                subtitle={`${percentualExecucao}% do orçamento previsto`}
                icon={<TrendingDown size={18} strokeWidth={1.75} />}
                tone={Number(percentualExecucao) > 100 ? 'danger' : 'neutral'}
              />

              <KpiCard
                label="Saldo Disponível em Tempo Real"
                value={formatCurrencyBRL(metrics.saldoDisponivel)}
                subtitle={
                  metrics.totalRemessas > 0
                    ? `Inclui ${formatCurrencyBRL(metrics.totalRemessas)} em remessas`
                    : 'Orçamento + entradas - saídas'
                }
                icon={<Wallet size={18} strokeWidth={1.75} />}
                tone={saldoTone}
              />

              <KpiCard
                label="Empréstimos / Pendências"
                value={formatCurrencyBRL(metrics.saldoDevedorEmprestimos)}
                subtitle={`Recebido: ${formatCurrencyBRL(metrics.totalEmprestimosRecebidos)} · Devolvido: ${formatCurrencyBRL(metrics.totalEmprestimosDevolvidos)}`}
                icon={<ArrowLeftRight size={18} strokeWidth={1.75} />}
                tone={metrics.saldoDevedorEmprestimos > 0 ? 'warning' : 'neutral'}
              />
            </section>

            {/* 3.3. Grid Analítico (2 Colunas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1 — Execução Orçamentária por Status / Rubrica */}
              <section className="bg-white border border-[#C6D2D0] rounded-xl p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="text-lg font-semibold text-[#0F273D] font-display">
                      Execução Orçamentária
                    </h2>
                    <span className="text-xs text-[#748598]">Por status das rubricas</span>
                  </div>

                  <DonutChart
                    slices={execucaoSlices}
                    centerLabel="Orçamento"
                    centerValue={formatCurrencyBRL(metrics.orcamentoPrevisto)}
                    emptyMessage="Cadastre rubricas no orçamento para acompanhar a execução."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#C6D2D0]/50">
                  {permissions.canManageBudget && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Plus size={15} strokeWidth={1.75} />}
                      onClick={() => navigate(`/projetos/${id}/orcamento`)}
                    >
                      Criar item
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/projetos/${id}/orcamento`)}
                  >
                    Ver rubricas
                  </Button>
                </div>
              </section>

              {/* Card 2 — Distribuição de Movimentações (Entradas vs. Saídas) */}
              <section className="bg-white border border-[#C6D2D0] rounded-xl p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="text-lg font-semibold text-[#0F273D] font-display">
                      Distribuição de Movimentações
                    </h2>
                    <span className="text-xs text-[#748598]">Fontes de recurso vs. saídas</span>
                  </div>

                  <DonutChart
                    slices={movimentacaoSlices}
                    centerLabel="Fluxo Total"
                    emptyMessage="Nenhuma movimentação financeira registrada até o momento."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#C6D2D0]/50">
                  {permissions.canLaunchFinancials && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Receipt size={15} strokeWidth={1.75} />}
                      onClick={() => navigate(`/projetos/${id}/movimentacoes/nova`)}
                    >
                      Lançar despesa
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/projetos/${id}/emprestimos`)}
                  >
                    Ver empréstimos
                  </Button>
                </div>
              </section>

              {/* Card 3 — Equipe do Projeto */}
              <EquipeCard
                membros={membros}
                canManageTeam={permissions.canManageProject}
                onAddMember={() => navigate(`/projetos/${id}/membros`)}
                onRemoveMember={handleRemoveMember}
              />

              {/* Card 4 — Últimas Movimentações e Filtros */}
              <MovimentacoesCard movimentacoes={movimentacoesUnificadas} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
