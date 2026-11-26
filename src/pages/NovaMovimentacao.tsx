import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Receipt,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  buscarProjetoPorId,
  ItemOrcamentoResDto,
  listarItensOrcamento,
  listarMembrosProjeto,
  ProjetoResDto,
  registrarDespesa,
  registrarRemessa,
  VinculoResponseDto,
} from '@/services/api';
import { formatCurrencyBRL } from '@/utils/formatters';
import { getProjectPermissions, resolveUserRoleInProject } from '@/utils/permissions';

type NaturezaMovimentacao = 'DESPESA' | 'REMESSA';

const MOCK_LEAF_ITENS: ItemOrcamentoResDto[] = [
  {
    idOrcamento: 101,
    rubrica: '33.90.30 - Material de Consumo',
    descricao: 'Insumos de laboratório',
    tipoItem: 'LEAF',
    valorPrevisto: 45000,
    valorExecutado: 38200,
    valorDisponivel: 6800,
    parentId: null,
  },
  {
    idOrcamento: 102,
    rubrica: '33.90.18 - Bolsas de Pesquisa',
    descricao: 'Bolsas de iniciação científica',
    tipoItem: 'LEAF',
    valorPrevisto: 65000,
    valorExecutado: 32500,
    valorDisponivel: 32500,
    parentId: null,
  },
];

/**
 * T08 - Cadastro de Entradas e Despesas (/projetos/:id/movimentacoes/nova)
 */
export function NovaMovimentacao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [projeto, setProjeto] = useState<ProjetoResDto | null>(null);
  const [itens, setItens] = useState<ItemOrcamentoResDto[]>([]);
  const [membros, setMembros] = useState<VinculoResponseDto[]>([]);

  const [natureza, setNatureza] = useState<NaturezaMovimentacao>('DESPESA');
  const [valor, setValor] = useState('');
  const [dataMovimentacao, setDataMovimentacao] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [idItemOrcamento, setIdItemOrcamento] = useState('');
  const [identificacaoAporte, setIdentificacaoAporte] = useState('');
  const [descricao, setDescricao] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const results = await Promise.allSettled([
      buscarProjetoPorId(id),
      listarItensOrcamento(id, 100),
      listarMembrosProjeto(id),
    ]);

    if (results[0].status === 'fulfilled') {
      setUsingMock(false);
      setProjeto(results[0].value);
      setItens(results[1].status === 'fulfilled' ? results[1].value.content ?? [] : []);
      setMembros(results[2].status === 'fulfilled' ? results[2].value : []);
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
      setItens(MOCK_LEAF_ITENS);
      setMembros([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const role = useMemo(() => resolveUserRoleInProject(membros, projeto), [membros, projeto]);
  const permissions = useMemo(() => getProjectPermissions(role), [role]);

  const leafItens = useMemo(
    () => itens.filter((i) => i.tipoItem === 'LEAF'),
    [itens]
  );

  const selectedLeaf = useMemo(
    () => leafItens.find((i) => String(i.idOrcamento) === idItemOrcamento) ?? null,
    [leafItens, idItemOrcamento]
  );

  const numericValor = Number(valor.replace(',', '.')) || 0;
  const ultrapassaSaldoRubrica =
    natureza === 'DESPESA' &&
    selectedLeaf !== null &&
    numericValor > (selectedLeaf.valorDisponivel ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !permissions.canLaunchFinancials) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (numericValor <= 0) {
      setErrorMsg('Informe um valor estritamente positivo.');
      return;
    }

    if (!dataMovimentacao) {
      setErrorMsg('Informe a data da movimentação.');
      return;
    }

    if (natureza === 'DESPESA') {
      if (!idItemOrcamento) {
        setErrorMsg('Selecione a rubrica (Item Folha) vinculada à despesa.');
        return;
      }
      if (!descricao.trim()) {
        setErrorMsg('Informe a descrição / justificativa do gasto.');
        return;
      }
    } else if (!identificacaoAporte.trim()) {
      setErrorMsg('Informe a identificação do aporte / origem da remessa.');
      return;
    }

    setSubmitting(true);
    try {
      if (!usingMock) {
        if (natureza === 'DESPESA') {
          await registrarDespesa({
            idItemOrcamento: Number(idItemOrcamento),
            valorGasto: numericValor,
            dataCompetencia: dataMovimentacao,
            descricaoGasto: descricao.trim(),
          });
        } else {
          await registrarRemessa({
            idProjeto: Number(id),
            valor: numericValor,
            dataRecebimento: dataMovimentacao,
            identificacaoAporte: identificacaoAporte.trim(),
            descricao: descricao.trim() || undefined,
          });
        }
      }

      setSuccessMsg(
        natureza === 'DESPESA'
          ? 'Despesa registrada com sucesso!'
          : 'Entrada / Remessa registrada com sucesso!'
      );
      setValor('');
      setDescricao('');
      setIdentificacaoAporte('');
    } catch {
      setErrorMsg(
        'Não foi possível concluir o lançamento. Verifique a data (não pode ser anterior ao início do projeto) e suas permissões.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF6F4] flex flex-col">
      <Topbar userName="João Silva" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
              Nova Movimentação Financeira
            </h1>
            <p className="text-sm text-[#748598] mt-0.5">{projeto?.nome}</p>
          </div>
          <Badge variant={permissions.canLaunchFinancials ? 'success' : 'neutral'}>
            {permissions.papelLabel}
          </Badge>
        </div>

        {!permissions.canLaunchFinancials && (
          <div className="bg-[#DDA64B]/15 border border-[#DDA64B]/50 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-[#0F273D]">
            <Lock size={17} className="text-[#DDA64B] shrink-0" />
            <span>
              Seu papel neste projeto é <strong>{permissions.papelLabel}</strong>. Somente
              Coordenadores (OWNER) e Membros (MEMBER) podem lançar despesas ou remessas.
            </span>
          </div>
        )}

        <section className="bg-white border border-[#C6D2D0] rounded-xl p-5 sm:p-6 space-y-6">
          {/* 3.1. Seletor de Natureza */}
          <div>
            <span className="block text-xs font-medium text-[#748598] mb-2">
              Natureza da Movimentação
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNatureza('DESPESA')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                  natureza === 'DESPESA'
                    ? 'bg-[#DF4F52] text-white border-[#DF4F52] shadow-sm'
                    : 'bg-[#F5FAF9] text-[#0F273D] border-[#C6D2D0] hover:bg-[#ECF6F4]'
                }`}
              >
                <Receipt size={16} strokeWidth={1.75} />
                Despesa (Saída)
              </button>

              <button
                type="button"
                onClick={() => setNatureza('REMESSA')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                  natureza === 'REMESSA'
                    ? 'bg-[#2CE078] text-[#0F273D] border-[#2CE078] shadow-sm'
                    : 'bg-[#F5FAF9] text-[#0F273D] border-[#C6D2D0] hover:bg-[#ECF6F4]'
                }`}
              >
                <ArrowDownLeft size={16} strokeWidth={1.75} />
                Remessa / Entrada
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-[#DF4F52]/10 border border-[#DF4F52]/40 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-[#DF4F52]">
              <AlertCircle size={17} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#2CE078]/15 border border-[#2CE078]/60 rounded-lg px-4 py-3 flex items-center justify-between gap-2 text-sm text-[#0F273D]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/projetos/${id}`)}>
                Ir ao Dashboard
              </Button>
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-sm text-[#748598]">
              Carregando rubricas do projeto...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Valor (R$) *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  className="tabular-nums font-semibold"
                  disabled={!permissions.canLaunchFinancials}
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />

                <Input
                  label={
                    natureza === 'DESPESA' ? 'Data de Competência *' : 'Data de Recebimento *'
                  }
                  type="date"
                  disabled={!permissions.canLaunchFinancials}
                  value={dataMovimentacao}
                  onChange={(e) => setDataMovimentacao(e.target.value)}
                  required
                />
              </div>

              {natureza === 'DESPESA' ? (
                <div>
                  <label className="block text-xs font-medium text-[#748598] mb-1">
                    Rubrica / Item do Orçamento (Item Folha) *
                  </label>
                  <select
                    disabled={!permissions.canLaunchFinancials}
                    value={idItemOrcamento}
                    onChange={(e) => setIdItemOrcamento(e.target.value)}
                    required
                    className="w-full bg-white border border-[#C6D2D0] rounded-lg px-3 py-2 text-sm text-[#0F273D] focus:outline-none focus:border-[#0F273D] disabled:bg-gray-50"
                  >
                    <option value="">Selecione uma rubrica...</option>
                    {leafItens.map((item) => (
                      <option key={item.idOrcamento} value={item.idOrcamento}>
                        {item.rubrica} — Disponível: {formatCurrencyBRL(item.valorDisponivel)}
                      </option>
                    ))}
                  </select>

                  {ultrapassaSaldoRubrica && (
                    <div className="mt-2 bg-[#DDA64B]/15 border border-[#DDA64B]/60 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-[#0F273D]">
                      <AlertTriangle size={15} className="text-[#DDA64B] shrink-0" />
                      <span>
                        Atenção: este valor ultrapassa o saldo disponível da rubrica (
                        {formatCurrencyBRL(selectedLeaf?.valorDisponivel)}).
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  label="Identificação do Aporte / Origem *"
                  placeholder="Ex: Aporte Complementar CNPq, Doação..."
                  maxLength={100}
                  disabled={!permissions.canLaunchFinancials}
                  value={identificacaoAporte}
                  onChange={(e) => setIdentificacaoAporte(e.target.value)}
                  required
                />
              )}

              <div>
                <label className="block text-xs font-medium text-[#748598] mb-1">
                  {natureza === 'DESPESA'
                    ? 'Descrição / Justificativa *'
                    : 'Descrição / Observações (Opcional)'}
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  disabled={!permissions.canLaunchFinancials}
                  required={natureza === 'DESPESA'}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Informe nota fiscal, finalidade, termo de remessa ou detalhes..."
                  className="w-full bg-white border border-[#C6D2D0] rounded-lg px-3 py-2 text-sm text-[#0F273D] placeholder:text-[#748598] focus:outline-none focus:border-[#0F273D] disabled:bg-gray-50"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#C6D2D0]/50">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/projetos/${id}`)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !permissions.canLaunchFinancials}
                >
                  {submitting ? 'Registrando...' : 'Confirmar Lançamento'}
                </Button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
