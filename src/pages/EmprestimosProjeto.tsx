import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Lock,
  Plus,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  buscarExtratoEmprestimos,
  buscarProjetoPorId,
  EmprestimoResDto,
  ExtratoEmprestimoResDto,
  listarEmprestimosProjeto,
  listarMembrosProjeto,
  ProjetoResDto,
  registrarDevolucao,
  registrarEmprestimo,
  StatusEmprestimo,
  VinculoResponseDto,
} from '@/services/api';
import { formatCurrencyBRL, formatDateBR } from '@/utils/formatters';
import { getProjectPermissions, resolveUserRoleInProject } from '@/utils/permissions';

const STATUS_BADGE: Record<
  StatusEmprestimo,
  { label: string; variant: 'warning' | 'success' | 'danger' }
> = {
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  PARCIALMENTE_PAGO: { label: 'Parcialmente Pago', variant: 'warning' },
  QUITADO: { label: 'Quitado', variant: 'success' },
};

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

/**
 * T09 - Cadastro de Empréstimo e Devoluções (/projetos/:id/emprestimos)
 */
export function EmprestimosProjeto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [projeto, setProjeto] = useState<ProjetoResDto | null>(null);
  const [membros, setMembros] = useState<VinculoResponseDto[]>([]);
  const [emprestimos, setEmprestimos] = useState<EmprestimoResDto[]>([]);
  const [extrato, setExtrato] = useState<ExtratoEmprestimoResDto | null>(null);

  // Formulário novo empréstimo
  const [credor, setCredor] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal de devolução
  const [devolucaoTarget, setDevolucaoTarget] = useState<EmprestimoResDto | null>(null);
  const [devolucaoValor, setDevolucaoValor] = useState('');
  const [devolucaoData, setDevolucaoData] = useState(new Date().toISOString().slice(0, 10));
  const [devolucaoDesc, setDevolucaoDesc] = useState('');
  const [submittingDevolucao, setSubmittingDevolucao] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const results = await Promise.allSettled([
      buscarProjetoPorId(id),
      listarMembrosProjeto(id),
      listarEmprestimosProjeto(id),
      buscarExtratoEmprestimos(id),
    ]);

    if (results[0].status === 'fulfilled') {
      setUsingMock(false);
      setProjeto(results[0].value);
      setMembros(results[1].status === 'fulfilled' ? results[1].value : []);
      setEmprestimos(results[2].status === 'fulfilled' ? results[2].value : []);
      setExtrato(results[3].status === 'fulfilled' ? results[3].value : null);
    } else {
      setUsingMock(true);
      setProjeto({
        id: Number(id) || 1,
        nome: 'Edital PIBIC 2026 - Laboratório de Dados',
        descricao: '',
        financiador: 'CNPq / IFPB',
        valor: 150000,
        dataInicio: '2026-01-15',
        dataFim: '2026-12-20',
        orcamentoId: 10,
        usuarioId: 1,
      });
      setMembros([]);
      setEmprestimos(MOCK_EMPRESTIMOS);
      setExtrato(MOCK_EXTRATO);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const role = useMemo(() => resolveUserRoleInProject(membros, projeto), [membros, projeto]);
  const permissions = useMemo(() => getProjectPermissions(role), [role]);

  async function handleRegistrarEmprestimo(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !permissions.canLaunchFinancials) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const numericValor = Number(valor.replace(',', '.'));
    if (!credor.trim() || Number.isNaN(numericValor) || numericValor <= 0 || !dataVencimento) {
      setErrorMsg('Preencha credor, valor positivo e data de vencimento.');
      return;
    }

    setSubmitting(true);
    try {
      if (usingMock) {
        const novo: EmprestimoResDto = {
          id: Date.now(),
          idProjeto: Number(id),
          valor: numericValor,
          credor: credor.trim(),
          dataVencimento,
          status: 'PENDENTE',
          observacoes: observacoes.trim(),
          descricao: descricao.trim(),
          dataLancamento: new Date().toISOString().slice(0, 10),
        };
        setEmprestimos((prev) => [novo, ...prev]);
        setExtrato((prev) =>
          prev
            ? {
                ...prev,
                totalRecebido: prev.totalRecebido + numericValor,
                saldoDevedor: prev.saldoDevedor + numericValor,
              }
            : null
        );
      } else {
        await registrarEmprestimo({
          idProjeto: Number(id),
          valor: numericValor,
          dataVencimento,
          credor: credor.trim(),
          observacoes: observacoes.trim() || undefined,
          descricao: descricao.trim() || undefined,
        });
        await carregarDados();
      }

      setCredor('');
      setValor('');
      setDataVencimento('');
      setDescricao('');
      setObservacoes('');
      setSuccessMsg('Empréstimo registrado com sucesso!');
    } catch {
      setErrorMsg('Não foi possível registrar o empréstimo. Verifique os dados informados.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDevolucao(e: React.FormEvent) {
    e.preventDefault();
    if (!devolucaoTarget || !permissions.canLaunchFinancials) return;

    const numericVal = Number(devolucaoValor.replace(',', '.'));
    if (Number.isNaN(numericVal) || numericVal <= 0 || !devolucaoData) {
      setErrorMsg('Informe um valor positivo e a data da devolução.');
      return;
    }

    setSubmittingDevolucao(true);
    setErrorMsg(null);
    try {
      if (usingMock) {
        setExtrato((prev) =>
          prev
            ? {
                ...prev,
                totalDevolvido: prev.totalDevolvido + numericVal,
                saldoDevedor: Math.max(0, prev.saldoDevedor - numericVal),
              }
            : null
        );
      } else {
        await registrarDevolucao(devolucaoTarget.id, {
          valor: numericVal,
          dataDevolucao: devolucaoData,
          descricao: devolucaoDesc.trim() || undefined,
        });
        await carregarDados();
      }

      setDevolucaoTarget(null);
      setDevolucaoValor('');
      setDevolucaoDesc('');
      setSuccessMsg('Devolução registrada com sucesso!');
    } catch {
      setErrorMsg('Erro ao registrar devolução (verifique se o valor não excede o saldo).');
    } finally {
      setSubmittingDevolucao(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF6F4] flex flex-col">
      <Topbar userName="João Silva" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Cabeçalho */}
        <header className="bg-white border border-[#C6D2D0] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => navigate(`/projetos/${id}`)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#748598] hover:text-[#0F273D] transition-colors cursor-pointer mb-1.5"
              >
                <ArrowLeft size={14} />
                Voltar ao Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F273D] font-display">
                Empréstimos e Devoluções — {projeto?.nome ?? `Projeto #${id}`}
              </h1>
            </div>
            <Badge variant={permissions.canLaunchFinancials ? 'success' : 'neutral'}>
              {permissions.papelLabel}
            </Badge>
          </div>

          {/* Resumo do Extrato */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#C6D2D0]/50">
            <div className="bg-[#F5FAF9] border border-[#C6D2D0]/70 rounded-lg p-4">
              <span className="text-xs font-medium text-[#748598]">Total Recebido</span>
              <p className="text-lg font-bold text-[#0F273D] tabular-nums mt-1">
                {formatCurrencyBRL(extrato?.totalRecebido ?? 0)}
              </p>
            </div>
            <div className="bg-[#F5FAF9] border border-[#C6D2D0]/70 rounded-lg p-4">
              <span className="text-xs font-medium text-[#748598]">Total Devolvido</span>
              <p className="text-lg font-bold text-[#0F273D] tabular-nums mt-1">
                {formatCurrencyBRL(extrato?.totalDevolvido ?? 0)}
              </p>
            </div>
            <div className="bg-[#DDA64B]/10 border border-[#DDA64B]/50 rounded-lg p-4">
              <span className="text-xs font-medium text-[#748598]">Saldo Devedor</span>
              <p className="text-lg font-bold text-[#0F273D] tabular-nums mt-1">
                {formatCurrencyBRL(extrato?.saldoDevedor ?? 0)}
              </p>
            </div>
          </div>
        </header>

        {!permissions.canLaunchFinancials && (
          <div className="bg-[#DDA64B]/15 border border-[#DDA64B]/50 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-[#0F273D]">
            <Lock size={17} className="text-[#DDA64B] shrink-0" />
            <span>
              Seu papel neste projeto é <strong>{permissions.papelLabel}</strong>. Somente
              Coordenadores (OWNER) e Membros (MEMBER) podem registrar empréstimos ou devoluções.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-[#DF4F52]/10 border border-[#DF4F52]/40 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#DF4F52]">
            <AlertCircle size={17} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#2CE078]/15 border border-[#2CE078]/60 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#0F273D]">
            <CheckCircle2 size={17} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 3.1. Formulário: Novo Registro de Empréstimo */}
        {permissions.canLaunchFinancials && (
          <section className="bg-white border border-[#C6D2D0] rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowLeftRight size={18} strokeWidth={1.75} className="text-[#0F273D]" />
              <h2 className="text-lg font-semibold text-[#0F273D] font-display">
                Novo Registro de Empréstimo
              </h2>
            </div>

            <form
              onSubmit={handleRegistrarEmprestimo}
              className="grid grid-cols-1 md:grid-cols-12 gap-4"
            >
              <div className="md:col-span-5">
                <Input
                  label="Credor (Origem / Contraparte) *"
                  placeholder="Ex: Fundo Institucional IFPB, Projeto Parceiro..."
                  maxLength={100}
                  value={credor}
                  onChange={(e) => setCredor(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  label="Valor Principal (R$) *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  className="tabular-nums"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-4">
                <Input
                  label="Prazo Previsto / Vencimento *"
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-6">
                <Input
                  label="Descrição (Opcional)"
                  placeholder="Finalidade do empréstimo..."
                  maxLength={500}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="md:col-span-6">
                <Input
                  label="Observações / Condições (Opcional)"
                  placeholder="Número de processo, termo ou condições..."
                  maxLength={500}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              <div className="md:col-span-12 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  icon={<Plus size={16} />}
                >
                  {submitting ? 'Registrando...' : 'Registrar Empréstimo'}
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* 3.2. Painel de Acompanhamento e Devoluções */}
        <section className="bg-white border border-[#C6D2D0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#C6D2D0]/60 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0F273D] font-display">
              Empréstimos Vinculados ao Projeto
            </h2>
            <span className="text-xs text-[#748598] tabular-nums">
              {emprestimos.length} registro(s)
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[#748598]">
              Carregando empréstimos...
            </div>
          ) : emprestimos.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#748598]">
              Nenhum empréstimo registrado para este projeto.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5FAF9] border-b border-[#C6D2D0]/70 text-xs font-medium text-[#748598]">
                    <th className="py-3 px-4">Credor</th>
                    <th className="py-3 px-4">Lançamento</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    {permissions.canLaunchFinancials && (
                      <th className="py-3 px-4 text-right">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C6D2D0]/50 text-sm">
                  {emprestimos.map((emp) => {
                    const badgeInfo = STATUS_BADGE[emp.status] ?? {
                      label: emp.status,
                      variant: 'warning' as const,
                    };
                    return (
                      <tr key={emp.id} className="hover:bg-[#F5FAF9]/60">
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#0F273D]">{emp.credor}</p>
                          {emp.descricao && (
                            <p className="text-xs text-[#748598] truncate max-w-xs">
                              {emp.descricao}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#748598] tabular-nums">
                          {formatDateBR(emp.dataLancamento)}
                        </td>
                        <td className="py-3 px-4 text-[#0F273D] tabular-nums">
                          {formatDateBR(emp.dataVencimento)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#0F273D] tabular-nums">
                          {formatCurrencyBRL(emp.valor)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                        </td>
                        {permissions.canLaunchFinancials && (
                          <td className="py-3 px-4 text-right">
                            {emp.status !== 'QUITADO' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setDevolucaoTarget(emp);
                                  setDevolucaoValor('');
                                  setDevolucaoDesc('');
                                }}
                              >
                                Registrar Devolução
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal de Devolução */}
      {devolucaoTarget && (
        <div className="fixed inset-0 z-50 bg-[#0F273D]/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#C6D2D0] rounded-xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F273D] font-display">
                Registrar Devolução
              </h3>
              <button
                type="button"
                onClick={() => setDevolucaoTarget(null)}
                className="p-1 text-[#748598] hover:text-[#0F273D]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#748598]">
              Credor: <strong className="text-[#0F273D]">{devolucaoTarget.credor}</strong> · Valor
              original:{' '}
              <strong className="text-[#0F273D] tabular-nums">
                {formatCurrencyBRL(devolucaoTarget.valor)}
              </strong>
            </p>

            <form onSubmit={handleConfirmDevolucao} className="space-y-4">
              <Input
                label="Valor da Devolução (R$) *"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                className="tabular-nums"
                value={devolucaoValor}
                onChange={(e) => setDevolucaoValor(e.target.value)}
                required
              />

              <Input
                label="Data da Devolução *"
                type="date"
                value={devolucaoData}
                onChange={(e) => setDevolucaoData(e.target.value)}
                required
              />

              <Input
                label="Descrição / Comprovante (Opcional)"
                placeholder="Ex: Parcela 1/2 via GRU..."
                maxLength={500}
                value={devolucaoDesc}
                onChange={(e) => setDevolucaoDesc(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDevolucaoTarget(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={submittingDevolucao}>
                  {submittingDevolucao ? 'Salvando...' : 'Confirmar Devolução'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
