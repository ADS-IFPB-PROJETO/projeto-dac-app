import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trash2, Users } from 'lucide-react';

import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  RubricaNode,
  RubricasBuilder,
  calcularTotalRubricas,
} from '@/components/projetos/ItensBuilder';
import {
  atualizarProjeto,
  buscarProjetoPorId,
  cadastrarProjeto,
  criarItemOrcamento,
  listarProjetos,
  listarUsuarios,
  StatusProjeto,
  UsuarioResumoDto,
} from '@/services/api';

type PapelMembro = 'Gestor' | 'Editor' | 'Visualizador';

interface MembroSelecionado extends UsuarioResumoDto {
  papel: PapelMembro;
}

const MOCK_USUARIOS: UsuarioResumoDto[] = [
  { id: 2, nome: 'Maria Almeida', email: 'maria.almeida@ifpb.edu.br' },
  { id: 3, nome: 'Lucas Costa', email: 'lucas.costa@ifpb.edu.br' },
  { id: 4, nome: 'Rafael Ferreira', email: 'rafael.ferreira@ifpb.edu.br' },
  { id: 5, nome: 'Ana Lima', email: 'ana.lima@ifpb.edu.br' },
];

export function CadastroProjeto() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [nome, setNome] = useState('');
  const [financiador, setFinanciador] = useState('Edital Público');
  const [valor, setValor] = useState('');
  const [statusProjeto, setStatusProjeto] = useState<StatusProjeto>('INICIANDO');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [descricao, setDescricao] = useState('');

  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<UsuarioResumoDto[]>([]);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioResumoDto | null>(null);
  const [papelSelecionado, setPapelSelecionado] = useState<PapelMembro>('Editor');
  const [membros, setMembros] = useState<MembroSelecionado[]>([]);
  const [rubricas, setRubricas] = useState<RubricaNode[]>([]);

  const [loadingDados, setLoadingDados] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function carregarUsuarios() {
      try {
        const data = await listarUsuarios();
        if (active) setUsuariosDisponiveis(data);
      } catch {
        if (active) setUsuariosDisponiveis(MOCK_USUARIOS);
      }
    }

    carregarUsuarios();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function carregarProjeto() {
      setLoadingDados(true);
      try {
        const projeto = await buscarProjetoPorId(id!);
        if (!active) return;
        setNome(projeto.nome);
        setFinanciador(projeto.financiador);
        setValor(String(projeto.valor));
        setDataInicio(projeto.dataInicio);
        setDataFim(projeto.dataFim);
        setDescricao(projeto.descricao);
      } catch {
        if (active) {
          setErro('Não foi possível carregar os dados do projeto para edição.');
        }
      } finally {
        if (active) setLoadingDados(false);
      }
    }

    carregarProjeto();
    return () => {
      active = false;
    };
  }, [id]);

  const sugestoesUsuarios = useMemo(() => {
    const q = buscaUsuario.trim().toLowerCase();
    if (!q) return [];
    const idsJaAdicionados = new Set(membros.map((m) => m.id));
    return usuariosDisponiveis
      .filter(
        (u) =>
          !idsJaAdicionados.has(u.id) &&
          (u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [buscaUsuario, usuariosDisponiveis, membros]);

  const handleAdicionarMembro = () => {
    if (!usuarioSelecionado) return;
    if (membros.some((m) => m.id === usuarioSelecionado.id)) return;

    setMembros((prev) => [
      ...prev,
      { ...usuarioSelecionado, papel: papelSelecionado },
    ]);
    setUsuarioSelecionado(null);
    setBuscaUsuario('');
  };

  const handleRemoverMembro = (usuarioId: number) => {
    setMembros((prev) => prev.filter((m) => m.id !== usuarioId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro('O nome do projeto é obrigatório.');
      return;
    }
    if (!financiador.trim()) {
      setErro('O financiador / categoria é obrigatório.');
      return;
    }
    if (descricao.trim().length < 10) {
      setErro('A descrição deve conter no mínimo 10 caracteres.');
      return;
    }
    if (!dataInicio || !dataFim) {
      setErro('Informe a data de início e a data de término.');
      return;
    }
    if (dataFim <= dataInicio) {
      setErro('A data de término deve ser posterior à data de início.');
      return;
    }

    const valorNumerico = Number(valor.replace(',', '.'));
    if (Number.isNaN(valorNumerico) || valorNumerico < 0) {
      setErro('Informe um valor de orçamento válido (maior ou igual a zero).');
      return;
    }

    const totalRubricas = calcularTotalRubricas(rubricas);
    if (totalRubricas > valorNumerico) {
      setErro(
        'O valor total dos itens é maior que o orçamento informado. Ajuste os itens antes de salvar.'
      );
      return;
    }

    const hasEmptyDescription = (nodes: RubricaNode[]): boolean =>
      nodes.some(
        (n) => !n.descricao.trim() || (n.filhas.length > 0 && hasEmptyDescription(n.filhas))
      );

    if (rubricas.length > 0 && hasEmptyDescription(rubricas)) {
      setErro('Preencha a descrição de todos os itens adicionados.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        financiador: financiador.trim(),
        valor: valorNumerico,
        dataInicio,
        dataFim,
        statusProjeto,
      };

      const salvarArvoreRubricas = async (
        idProjeto: number,
        nodes: RubricaNode[],
        prefix: string,
        parentId: number | null
      ) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const numeracao = `${prefix}${i + 1}.`;
          const isComposite = node.filhas.length > 0;
          const valorLeaf = isComposite
            ? 0
            : Number(node.valorPrevisto.replace(',', '.')) || 0;

          const criado = await criarItemOrcamento(idProjeto, {
            rubrica: numeracao,
            descricao: node.descricao.trim(),
            tipoItem: isComposite ? 'COMPOSITE' : 'LEAF',
            valorPrevisto: isComposite ? null : valorLeaf,
            parentId,
          });

          if (isComposite) {
            await salvarArvoreRubricas(
              idProjeto,
              node.filhas,
              numeracao,
              criado.idOrcamento
            );
          }
        }
      };

      if (isEditing && id) {
        const atualizado = await atualizarProjeto(id, payload);
        if (rubricas.length > 0) {
          await salvarArvoreRubricas(atualizado.id, rubricas, '', null);
        }
        navigate(`/projetos/${atualizado.id}`);
      } else {
        await cadastrarProjeto(payload);
        if (rubricas.length > 0) {
          const page = await listarProjetos();
          const projetoCriado = page.content.find(
            (p) => p.nome === payload.nome && p.dataInicio === payload.dataInicio
          );
          if (projetoCriado) {
            await salvarArvoreRubricas(projetoCriado.id, rubricas, '', null);
          }
        }
        navigate('/projetos');
      }
    } catch {
      setErro(
        'Erro ao salvar projeto. Verifique se a API está em execução e se você está autenticado.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECF6F4] flex flex-col">
      <Topbar
        userName="João Silva"
        searchQuery=""
        onSearchChange={() => { }}
      />

      <main className="flex-1 w-full max-w-[760px] mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/projetos"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#748598] hover:text-[#0F273D] transition-colors mb-6"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Voltar para Projetos
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F273D]">
            {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
          </h1>
          <p className="text-sm text-[#748598] mt-1">
            Preencha os dados gerais do projeto orçamentário e, se desejar, já vincule a equipe inicial.
          </p>
        </div>

        {erro && (
          <div className="mb-6 bg-[#DF4F52]/10 border border-[#DF4F52] text-[#DF4F52] text-sm rounded-lg px-4 py-3">
            {erro}
          </div>
        )}

        {loadingDados ? (
          <div className="bg-white border border-[#C6D2D0] rounded-xl p-8 text-center text-sm text-[#748598]">
            Carregando dados do projeto...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bloco 1: Dados Gerais do Projeto */}
            <section className="bg-white border border-[#C6D2D0] rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-[#0F273D]">
                1. Dados Gerais do Projeto
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0F273D]">
                  Nome do Projeto *
                </label>
                <Input
                  placeholder="Ex.: Edital PIBIC 2026 - Laboratório de Dados"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#0F273D]">
                    Tipo / Financiador *
                  </label>
                  <select
                    value={financiador}
                    onChange={(e) => setFinanciador(e.target.value)}
                    className="w-full h-10 bg-white border border-[#C6D2D0] rounded-lg px-3 text-sm text-[#0F273D] focus:outline-none focus:border-[#0F273D]"
                  >
                    <option value="Edital Público">Edital Público</option>
                    <option value="Serviço Terceirizado">Serviço Terceirizado</option>
                    <option value="Projeto Interno">Projeto Interno</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#0F273D]">
                    Orçamento Previsto (R$) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="tabular-nums"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#0F273D]">
                    Data de Início *
                  </label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#0F273D]">
                    Data de Término *
                  </label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#0F273D]">
                    Status Inicial *
                  </label>
                  <select
                    value={statusProjeto}
                    onChange={(e) => setStatusProjeto(e.target.value as StatusProjeto)}
                    className="w-full h-10 bg-white border border-[#C6D2D0] rounded-lg px-3 text-sm text-[#0F273D] focus:outline-none focus:border-[#0F273D]"
                  >
                    <option value="INICIANDO">Iniciando</option>
                    <option value="EM_EXECUCAO">Em Execução</option>
                    <option value="PAUSADO">Pausado</option>
                    <option value="ENCERRADO">Encerrado</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0F273D]">
                  Descrição / Objetivo *
                </label>
                <textarea
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o escopo, metas e principais entregas do projeto (mínimo 10 caracteres)..."
                  maxLength={1000}
                  className="w-full bg-white border border-[#C6D2D0] rounded-lg px-3 py-2 text-sm text-[#0F273D] placeholder:text-[#748598] focus:outline-none focus:border-[#0F273D]"
                  required
                />
              </div>
            </section>

            {/* Bloco 2: Rubricas e Itens de Orçamento (Padrão Composite) */}
            <RubricasBuilder
              rubricas={rubricas}
              onChange={setRubricas}
              orcamentoTotal={Math.max(0, Number(valor.replace(',', '.')) || 0)}
            />

            {/* Bloco 3: Equipe Inicial (Opcional) */}
            <section className="bg-white border border-[#C6D2D0] rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#0F273D] flex items-center gap-2">
                    <Users size={18} strokeWidth={1.75} />
                    3. Equipe Inicial (Opcional)
                  </h2>
                  <p className="text-sm text-[#748598] mt-1">
                    Adicione membros agora ou gerencie a equipe mais tarde pelo Dashboard do projeto.
                  </p>
                </div>
              </div>

              {/* Barra de Adição Rápida */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="relative flex-1 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#0F273D]">
                    Buscar usuário
                  </label>
                  <Input
                    placeholder="Nome ou e-mail do usuário..."
                    value={buscaUsuario}
                    onChange={(e) => {
                      setBuscaUsuario(e.target.value);
                      setUsuarioSelecionado(null);
                    }}
                    icon={<Search size={16} strokeWidth={1.75} />}
                  />

                  {sugestoesUsuarios.length > 0 && !usuarioSelecionado && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#C6D2D0] rounded-lg shadow-md overflow-hidden">
                      {sugestoesUsuarios.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setUsuarioSelecionado(u);
                            setBuscaUsuario(`${u.nome} (${u.email})`);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#ECF6F4] flex flex-col"
                        >
                          <span className="font-medium text-[#0F273D]">{u.nome}</span>
                          <span className="text-xs text-[#748598]">{u.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:w-40 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#0F273D]">Papel</label>
                  <select
                    value={papelSelecionado}
                    onChange={(e) => setPapelSelecionado(e.target.value as PapelMembro)}
                    className="w-full h-10 bg-white border border-[#C6D2D0] rounded-lg px-3 text-sm text-[#0F273D] focus:outline-none focus:border-[#0F273D]"
                  >
                    <option value="Gestor">Gestor</option>
                    <option value="Editor">Editor</option>
                    <option value="Visualizador">Visualizador</option>
                  </select>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAdicionarMembro}
                  disabled={!usuarioSelecionado}
                  className="h-10 shrink-0"
                >
                  <Plus size={16} strokeWidth={1.75} />
                  Adicionar à lista
                </Button>
              </div>

              {/* Lista de Membros Pré-selecionados */}
              {membros.length > 0 && (
                <div className="border border-[#C6D2D0] rounded-lg divide-y divide-[#C6D2D0]/60">
                  {membros.map((membro) => {
                    const iniciais = membro.nome
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join('');
                    return (
                      <div
                        key={membro.id}
                        className="flex items-center justify-between px-4 py-3 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#0F273D] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {iniciais}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#0F273D] truncate">
                              {membro.nome}
                            </p>
                            <p className="text-xs text-[#748598] truncate">
                              {membro.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="neutral">{membro.papel}</Badge>
                          <button
                            type="button"
                            onClick={() => handleRemoverMembro(membro.id)}
                            className="p-1.5 text-[#748598] hover:text-[#DF4F52] rounded-md transition-colors"
                            aria-label={`Remover ${membro.nome}`}
                          >
                            <Trash2 size={16} strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Ações do Rodapé */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/projetos')}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar Alterações'
                    : 'Salvar Projeto'}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
