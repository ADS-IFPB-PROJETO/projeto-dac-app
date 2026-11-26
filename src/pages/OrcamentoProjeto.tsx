import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  atualizarItemOrcamento,
  buscarProjetoPorId,
  criarItemOrcamento,
  deletarItemOrcamento,
  ItemOrcamentoReqDto,
  ItemOrcamentoResDto,
  listarItensOrcamento,
  listarMembrosProjeto,
  ProjetoResDto,
  TipoItemOrcamento,
  VinculoResponseDto,
} from '@/services/api';
import { formatCurrencyBRL } from '@/utils/formatters';
import { getProjectPermissions, resolveUserRoleInProject } from '@/utils/permissions';

const MOCK_ITENS: ItemOrcamentoResDto[] = [
  {
    idOrcamento: 100,
    rubrica: '33.90 - Despesas Correntes',
    descricao: 'Custeio geral e bolsas',
    tipoItem: 'COMPOSITE',
    valorPrevisto: 110000,
    valorExecutado: 70700,
    valorDisponivel: 39300,
    parentId: null,
  },
  {
    idOrcamento: 101,
    rubrica: '33.90.30 - Material de Consumo',
    descricao: 'Insumos de laboratório e periféricos',
    tipoItem: 'LEAF',
    valorPrevisto: 45000,
    valorExecutado: 38200,
    valorDisponivel: 6800,
    parentId: 100,
  },
  {
    idOrcamento: 102,
    rubrica: '33.90.18 - Bolsas de Pesquisa',
    descricao: 'Bolsas de iniciação científica (12 meses)',
    tipoItem: 'LEAF',
    valorPrevisto: 65000,
    valorExecutado: 32500,
    valorDisponivel: 32500,
    parentId: 100,
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

/**
 * T07 - Cadastro de Orçamento e Itens (Rubricas) (/projetos/:id/orcamento)
 */
export function OrcamentoProjeto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [projeto, setProjeto] = useState<ProjetoResDto | null>(null);
  const [itens, setItens] = useState<ItemOrcamentoResDto[]>([]);
  const [membros, setMembros] = useState<VinculoResponseDto[]>([]);

  // Formulário
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tipoItem, setTipoItem] = useState<TipoItemOrcamento>('LEAF');
  const [parentId, setParentId] = useState<string>('');
  const [rubrica, setRubrica] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorPrevisto, setValorPrevisto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
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
      setItens(MOCK_ITENS);
      setMembros([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const role = useMemo(() => resolveUserRoleInProject(membros, projeto), [membros, projeto]);
  const permissions = useMemo(() => getProjectPermissions(role), [role]);

  const composites = useMemo(
    () => itens.filter((item) => item.tipoItem === 'COMPOSITE'),
    [itens]
  );

  // Organização hierárquica: grupos compostos + seus filhos, seguidos por folhas raiz
  const orderedRows = useMemo(() => {
    const rows: { item: ItemOrcamentoResDto; depth: number }[] = [];
    const childrenByParent = new Map<number, ItemOrcamentoResDto[]>();

    for (const item of itens) {
      if (item.parentId !== null && item.parentId !== undefined) {
        const list = childrenByParent.get(item.parentId) ?? [];
        list.push(item);
        childrenByParent.set(item.parentId, list);
      }
    }

    const roots = itens.filter((i) => i.parentId === null || i.parentId === undefined);
    for (const root of roots) {
      rows.push({ item: root, depth: 0 });
      const children = childrenByParent.get(root.idOrcamento) ?? [];
      for (const child of children) {
        rows.push({ item: child, depth: 1 });
      }
    }

    // Garante que itens órfãos também apareçam caso o pai não esteja na página
    const includedIds = new Set(rows.map((r) => r.item.idOrcamento));
    for (const item of itens) {
      if (!includedIds.has(item.idOrcamento)) {
        rows.push({ item, depth: 0 });
      }
    }

    return rows;
  }, [itens]);

  const tetoOrcamentario = projeto?.valor ?? 0;
  const totalDistribuido = useMemo(() => {
    const leafs = itens.filter((i) => i.tipoItem === 'LEAF');
    if (leafs.length > 0) {
      return leafs.reduce((acc, i) => acc + (i.valorPrevisto || 0), 0);
    }
    return itens.reduce((acc, i) => acc + (i.valorPrevisto || 0), 0);
  }, [itens]);
  const saldoNaoAlocado = tetoOrcamentario - totalDistribuido;

  function resetForm() {
    setEditingId(null);
    setTipoItem('LEAF');
    setParentId('');
    setRubrica('');
    setDescricao('');
    setValorPrevisto('');
  }

  function handleStartEdit(item: ItemOrcamentoResDto) {
    setEditingId(item.idOrcamento);
    setTipoItem(item.tipoItem);
    setParentId(item.parentId ? String(item.parentId) : '');
    setRubrica(item.rubrica);
    setDescricao(item.descricao);
    setValorPrevisto(item.tipoItem === 'LEAF' ? String(item.valorPrevisto ?? '') : '');
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !permissions.canManageBudget) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!rubrica.trim() || !descricao.trim()) {
      setErrorMsg('Preencha o código/nome da rubrica e a descrição.');
      return;
    }

    const parsedValor =
      tipoItem === 'COMPOSITE' ? 0 : Number(valorPrevisto.replace(',', '.'));
    if (tipoItem === 'LEAF' && (Number.isNaN(parsedValor) || parsedValor < 0)) {
      setErrorMsg('Informe um valor previsto válido (maior ou igual a zero).');
      return;
    }

    const dto: ItemOrcamentoReqDto = {
      rubrica: rubrica.trim(),
      descricao: descricao.trim(),
      tipoItem,
      valorPrevisto: tipoItem === 'COMPOSITE' ? null : parsedValor,
      parentId: parentId ? Number(parentId) : null,
    };

    setSubmitting(true);
    try {
      if (usingMock) {
        if (editingId) {
          setItens((prev) =>
            prev.map((it) =>
              it.idOrcamento === editingId
                ? {
                    ...it,
                    rubrica: dto.rubrica,
                    descricao: dto.descricao,
                    tipoItem: dto.tipoItem,
                    valorPrevisto: dto.valorPrevisto ?? 0,
                    valorDisponivel: (dto.valorPrevisto ?? 0) - it.valorExecutado,
                    parentId: dto.parentId,
                  }
                : it
            )
          );
          setSuccessMsg('Item atualizado (modo demonstração).');
        } else {
          const newId = Date.now();
          setItens((prev) => [
            ...prev,
            {
              idOrcamento: newId,
              rubrica: dto.rubrica,
              descricao: dto.descricao,
              tipoItem: dto.tipoItem,
              valorPrevisto: dto.valorPrevisto ?? 0,
              valorExecutado: 0,
              valorDisponivel: dto.valorPrevisto ?? 0,
              parentId: dto.parentId,
            },
          ]);
          setSuccessMsg('Item adicionado ao orçamento (modo demonstração).');
        }
        resetForm();
        return;
      }

      if (editingId) {
        await atualizarItemOrcamento(editingId, dto);
        setSuccessMsg('Rubrica atualizada com sucesso!');
      } else {
        await criarItemOrcamento(id, dto);
        setSuccessMsg('Rubrica adicionada com sucesso!');
      }
      resetForm();
      await carregarDados();
    } catch {
      setErrorMsg('Não foi possível salvar a rubrica. Verifique as permissões e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: ItemOrcamentoResDto) {
    if (!permissions.canManageBudget) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (usingMock) {
        setItens((prev) => prev.filter((i) => i.idOrcamento !== item.idOrcamento));
        setSuccessMsg('Rubrica removida (modo demonstração).');
        return;
      }
      await deletarItemOrcamento(item.idOrcamento);
      setSuccessMsg('Rubrica removida com sucesso.');
      await carregarDados();
    } catch {
      setErrorMsg('Não foi possível excluir a rubrica (verifique se há despesas vinculadas).');
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF6F4] flex flex-col">
      <Topbar userName="João Silva" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* 3.1. Cabeçalho Consolidado */}
        <header className="bg-white border border-[#C6D2D0] rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => navigate(`/projetos/${id}`)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#748598] hover:text-[#0F273D] transition-colors cursor-pointer mb-1.5"
              >
                <ArrowLeft size={14} />
                Voltar ao Dashboard
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0F273D] font-display">
                  Orçamento e Rubricas — {projeto?.nome ?? `Projeto #${id}`}
                </h1>
                <Badge variant={permissions.canManageBudget ? 'success' : 'neutral'}>
                  {permissions.papelLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* 3 Indicadores Numéricos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#C6D2D0]/50">
            <div className="bg-[#F5FAF9] border border-[#C6D2D0]/70 rounded-lg p-4">
              <span className="text-xs font-medium text-[#748598]">Teto Orçamentário</span>
              <p className="text-lg font-bold text-[#0F273D] tabular-nums mt-1">
                {formatCurrencyBRL(tetoOrcamentario)}
              </p>
            </div>

            <div className="bg-[#F5FAF9] border border-[#C6D2D0]/70 rounded-lg p-4">
              <span className="text-xs font-medium text-[#748598]">
                Total Distribuído nas Rubricas
              </span>
              <p className="text-lg font-bold text-[#0F273D] tabular-nums mt-1">
                {formatCurrencyBRL(totalDistribuido)}
              </p>
            </div>

            <div
              className={`border rounded-lg p-4 ${
                saldoNaoAlocado < 0
                  ? 'bg-[#DF4F52]/10 border-[#DF4F52]/50'
                  : 'bg-[#F5FAF9] border-[#C6D2D0]/70'
              }`}
            >
              <span className="text-xs font-medium text-[#748598]">Saldo Não Alocado</span>
              <p
                className={`text-lg font-bold tabular-nums mt-1 ${
                  saldoNaoAlocado < 0 ? 'text-[#DF4F52]' : 'text-[#0F273D]'
                }`}
              >
                {formatCurrencyBRL(saldoNaoAlocado)}
              </p>
            </div>
          </div>
        </header>

        {/* Aviso de permissão para MEMBER / VIEWER */}
        {!permissions.canManageBudget && (
          <div className="bg-[#DDA64B]/15 border border-[#DDA64B]/50 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-[#0F273D]">
            <Lock size={17} className="text-[#DDA64B] shrink-0" />
            <span>
              Seu papel neste projeto é <strong>{permissions.papelLabel}</strong>. Somente o
              Coordenador (OWNER) pode cadastrar, editar ou excluir rubricas do orçamento.
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

        {/* 3.2. Formulário de Adição / Edição de Rubrica (apenas OWNER) */}
        {permissions.canManageBudget && (
          <section className="bg-white border border-[#C6D2D0] rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={18} strokeWidth={1.75} className="text-[#0F273D]" />
                <h2 className="text-lg font-semibold text-[#0F273D] font-display">
                  {editingId ? 'Editar Rubrica / Item' : 'Adicionar Rubrica / Item'}
                </h2>
              </div>
              {editingId && (
                <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={resetForm}>
                  Cancelar edição
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-[#748598] mb-1">
                  Tipo de Item
                </label>
                <select
                  value={tipoItem}
                  onChange={(e) => setTipoItem(e.target.value as TipoItemOrcamento)}
                  className="w-full bg-white border border-[#C6D2D0] rounded-lg px-3 py-2 text-sm text-[#0F273D] focus:outline-none focus:border-[#0F273D]"
                >
                  <option value="LEAF">Item Folha (Executável)</option>
                  <option value="COMPOSITE">Item Composto (Grupo)</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-[#748598] mb-1">
                  Rubrica Pai (Opcional)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-white border border-[#C6D2D0] rounded-lg px-3 py-2 text-sm text-[#0F273D] focus:outline-none focus:border-[#0F273D]"
                >
                  <option value="">Sem grupo pai (Raiz)</option>
                  {composites
                    .filter((c) => c.idOrcamento !== editingId)
                    .map((c) => (
                      <option key={c.idOrcamento} value={c.idOrcamento}>
                        {c.rubrica}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <Input
                  label="Código / Nome da Rubrica *"
                  placeholder="Ex: 33.90.30 - Material"
                  value={rubrica}
                  onChange={(e) => setRubrica(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  label={
                    tipoItem === 'COMPOSITE'
                      ? 'Valor Previsto (Calculado pelos filhos)'
                      : 'Valor Previsto (R$) *'
                  }
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  disabled={tipoItem === 'COMPOSITE'}
                  value={tipoItem === 'COMPOSITE' ? '' : valorPrevisto}
                  onChange={(e) => setValorPrevisto(e.target.value)}
                  required={tipoItem === 'LEAF'}
                />
              </div>

              <div className="md:col-span-9">
                <Input
                  label="Descrição / Especificação *"
                  placeholder="Descreva os itens ou finalidade desta rubrica..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-3 flex items-end">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={submitting}
                  icon={<Plus size={16} />}
                >
                  {submitting
                    ? 'Salvando...'
                    : editingId
                      ? 'Salvar Alterações'
                      : 'Adicionar Item'}
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* 3.3. Árvore Hierárquica do Orçamento */}
        <section className="bg-white border border-[#C6D2D0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#C6D2D0]/60 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0F273D] font-display">
              Estrutura Hierárquica do Orçamento
            </h2>
            <span className="text-xs text-[#748598] tabular-nums">
              {itens.length} item(ns)
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[#748598]">Carregando orçamento...</div>
          ) : orderedRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#748598]">
              Nenhuma rubrica cadastrada neste orçamento ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5FAF9] border-b border-[#C6D2D0]/70 text-xs font-medium text-[#748598]">
                    <th className="py-3 px-4">Rubrica</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4 text-right">Valor Previsto</th>
                    <th className="py-3 px-4 text-right">Valor Executado</th>
                    <th className="py-3 px-4 text-right">Saldo da Rubrica</th>
                    {permissions.canManageBudget && (
                      <th className="py-3 px-4 text-right">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C6D2D0]/50 text-sm">
                  {orderedRows.map(({ item, depth }) => {
                    const isComposite = item.tipoItem === 'COMPOSITE';
                    const saldoNegativo = item.valorDisponivel < 0;

                    return (
                      <tr
                        key={item.idOrcamento}
                        className={isComposite ? 'bg-[#F5FAF9] font-semibold' : 'bg-white hover:bg-[#F5FAF9]/60'}
                      >
                        <td className="py-3 px-4 text-[#0F273D]">
                          <div
                            className="flex items-center gap-2"
                            style={{ paddingLeft: depth > 0 ? '1.5rem' : '0' }}
                          >
                            <Badge variant={isComposite ? 'default' : 'neutral'}>
                              {isComposite ? 'Grupo' : 'Folha'}
                            </Badge>
                            <span>{item.rubrica}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#748598] font-normal max-w-xs truncate">
                          {item.descricao}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#0F273D]">
                          {formatCurrencyBRL(item.valorPrevisto)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-[#0F273D]">
                          {formatCurrencyBRL(item.valorExecutado)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right tabular-nums font-semibold ${
                            saldoNegativo ? 'text-[#DF4F52]' : 'text-[#0F273D]'
                          }`}
                        >
                          {formatCurrencyBRL(item.valorDisponivel)}
                        </td>
                        {permissions.canManageBudget && (
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                title="Editar rubrica"
                                className="p-1.5 rounded-md text-[#748598] hover:text-[#0F273D] hover:bg-[#ECF6F4]"
                              >
                                <Pencil size={15} strokeWidth={1.75} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                title="Excluir rubrica"
                                className="p-1.5 rounded-md text-[#748598] hover:text-[#DF4F52] hover:bg-[#DF4F52]/10"
                              >
                                <Trash2 size={15} strokeWidth={1.75} />
                              </button>
                            </div>
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
    </div>
  );
}
