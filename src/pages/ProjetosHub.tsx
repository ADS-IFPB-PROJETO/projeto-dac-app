import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '@/components/layout/Topbar';
import { ProjetoCard, ProjetoCardItem, ProjetoStatus } from '@/components/projetos/ProjetoCard';
import { Button } from '@/components/ui/Button';
import { listarProjetos } from '@/services/api';

type VinculoTab = 'meus' | 'membro';
type StatusFilter = 'Todos' | ProjetoStatus;
type SortOrder = 'recentes' | 'antigos' | 'vigencia';

const CURRENT_USER_ID = 1;

const MOCK_PROJETOS: ProjetoCardItem[] = [
  {
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
    tipo: 'Edital',
    status: 'Ativo',
    membrosIniciais: ['JS', 'MA', 'LC'],
  },
  {
    id: 2,
    nome: 'Modernização Rede Campus João Pessoa',
    descricao:
      'Contratação de serviços terceirizados para cabeamento estruturado e switches de alta disponibilidade.',
    financiador: 'Recursos Próprios',
    valor: 285400.5,
    dataInicio: '2026-02-01',
    dataFim: '2026-11-30',
    orcamentoId: 11,
    usuarioId: 1,
    tipo: 'Terceirizado',
    status: 'Ativo',
    membrosIniciais: ['JS', 'RF'],
  },
  {
    id: 3,
    nome: 'Capacitação Docente em IA Aplicada',
    descricao:
      'Programa de formação continuada com oficinas práticas, material didático e certificação.',
    financiador: 'CAPES',
    valor: 74200,
    dataInicio: '2025-03-01',
    dataFim: '2025-12-15',
    orcamentoId: 12,
    usuarioId: 2,
    tipo: 'Edital',
    status: 'Concluído',
    membrosIniciais: ['AL', 'JS', 'PR', 'MC'],
  },
];

function inferStatus(dataFim?: string): ProjetoStatus {
  if (!dataFim) return 'Ativo';
  const hoje = new Date().toISOString().slice(0, 10);
  return dataFim < hoje ? 'Concluído' : 'Ativo';
}

function ProjectCardSkeleton() {
  return (
    <div className="bg-white border border-[#C6D2D0] rounded-xl p-5 animate-pulse flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-100">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
      </div>
      <div className="h-8 bg-gray-200 rounded" />
    </div>
  );
}

export function ProjetosHub() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<VinculoTab>('meus');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recentes');

  const [projetos, setProjetos] = useState<ProjetoCardItem[]>(MOCK_PROJETOS);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function carregar() {
      try {
        setLoading(true);
        const res = await listarProjetos();
        if (!isMounted) return;

        if (res?.content && res.content.length > 0) {
          const itens: ProjetoCardItem[] = res.content.map((p) => ({
            ...p,
            status: inferStatus(p.dataFim),
            tipo: p.financiador ? 'Edital' : 'Terceirizado',
            membrosIniciais: ['JS'],
          }));
          setProjetos(itens);
          setUsingMock(false);
        } else {
          setProjetos(MOCK_PROJETOS);
          setUsingMock(true);
        }
      } catch {
        if (!isMounted) return;
        // Fallback resiliente para exibição do layout mesmo sem backend rodando
        setProjetos(MOCK_PROJETOS);
        setUsingMock(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    carregar();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjetos = useMemo(() => {
    return projetos
      .filter((p) => {
        if (tab === 'meus') {
          return p.usuarioId === CURRENT_USER_ID;
        }
        return p.usuarioId !== CURRENT_USER_ID;
      })
      .filter((p) => {
        if (statusFilter === 'Todos') return true;
        return p.status === statusFilter;
      })
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.nome.toLowerCase().includes(q) ||
          (p.descricao && p.descricao.toLowerCase().includes(q)) ||
          (p.financiador && p.financiador.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'recentes') return b.id - a.id;
        if (sortOrder === 'antigos') return a.id - b.id;
        if (sortOrder === 'vigencia') {
          return (a.dataFim || '').localeCompare(b.dataFim || '');
        }
        return 0;
      });
  }, [projetos, tab, search, statusFilter, sortOrder]);

  return (
    <div className="min-h-screen bg-[#ECF6F4] flex flex-col">
      <Topbar
        userName="João Silva"
        searchQuery={search}
        onSearchChange={setSearch}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Cabeçalho de Boas-Vindas e Ação Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F273D] font-display tracking-tight">
              Projetos e Convênios
            </h1>
            <p className="text-sm text-[#748598] mt-1">
              Gerencie seus editais, serviços terceirizados, vigências e orçamentos.
            </p>
          </div>

          <Button
            onClick={() => navigate('/projetos/novo')}
            icon={<Plus size={18} />}
            className="self-start sm:self-auto"
          >
            Novo Projeto
          </Button>
        </div>

        {usingMock && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#DDA64B]/10 border border-[#DDA64B]/30 text-[#0F273D] text-xs">
            <AlertCircle size={16} className="text-[#DDA64B] shrink-0" />
            <span>
              Exibindo dados de demonstração (mock). O backend não foi detectado em{' '}
              <code className="font-mono bg-white/60 px-1 py-0.5 rounded">
                https://localhost:8443
              </code>
              .
            </span>
          </div>
        )}

        {/* Barra de Filtros e Controles */}
        <div className="bg-white border border-[#C6D2D0] rounded-xl p-3 sm:p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
          {/* Abas: Meus Projetos / Membro */}
          <div className="flex rounded-lg bg-[#ECF6F4] p-1 self-start">
            <button
              type="button"
              onClick={() => setTab('meus')}
              className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                tab === 'meus'
                  ? 'bg-white text-[#0F273D] shadow-xs'
                  : 'text-[#748598] hover:text-[#0F273D]'
              }`}
            >
              Meus Projetos
            </button>
            <button
              type="button"
              onClick={() => setTab('membro')}
              className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                tab === 'membro'
                  ? 'bg-white text-[#0F273D] shadow-xs'
                  : 'text-[#748598] hover:text-[#0F273D]'
              }`}
            >
              Onde sou membro
            </button>
          </div>

          {/* Filtros de Status e Ordenação */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status */}
            <div className="flex items-center gap-1.5 text-xs text-[#748598]">
              <Filter size={14} />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="bg-[#F5FAF9] border border-[#C6D2D0] rounded-md px-2 py-1 text-xs text-[#0F273D] font-medium focus:outline-none focus:border-[#0F273D]"
              >
                <option value="Todos">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Concluído">Concluído</option>
                <option value="Em Atraso">Em Atraso</option>
              </select>
            </div>

            {/* Ordenação */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-[#F5FAF9] border border-[#C6D2D0] rounded-md px-2 py-1 text-xs text-[#0F273D] font-medium focus:outline-none focus:border-[#0F273D]"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="vigencia">Vigência mais próxima</option>
            </select>
          </div>
        </div>

        {/* Grid de Cards de Projetos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        ) : filteredProjetos.length === 0 ? (
          <div className="bg-white border border-[#C6D2D0] rounded-xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#ECF6F4] flex items-center justify-center text-[#748598] mb-3">
              <Search size={22} />
            </div>
            <h3 className="text-base font-semibold text-[#0F273D] mb-1">
              Nenhum projeto encontrado
            </h3>
            <p className="text-sm text-[#748598] max-w-sm mb-4">
              Tente ajustar sua busca ou filtros para encontrar o que procura.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('Todos');
              }}
              icon={<RefreshCw size={14} />}
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjetos.map((proj) => (
              <ProjetoCard
                key={proj.id}
                projeto={proj}
                onView={(id) => navigate(`/projetos/${id}`)}
                onEdit={(id) => navigate(`/projetos/${id}/editar`)}
                onManageMembers={(id) => navigate(`/projetos/${id}/membros`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
