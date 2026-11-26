import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, Receipt, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyBRL, formatDateBR } from '@/utils/formatters';

export type TipoMovimentacao = 'DESPESA' | 'REMESSA' | 'EMPRESTIMO';

export interface MovimentacaoItem {
  id: string;
  tipo: TipoMovimentacao;
  data: string; // ISO YYYY-MM-DD
  descricao: string;
  origemOuRubrica: string;
  valor: number;
  ehEntrada: boolean;
}

type FiltroTipo = 'TODOS' | TipoMovimentacao;
type FiltroPeriodo = 'TODOS' | '30D' | '90D';

interface MovimentacoesCardProps {
  movimentacoes: MovimentacaoItem[];
}

const TIPO_LABEL: Record<TipoMovimentacao, string> = {
  DESPESA: 'Despesa',
  REMESSA: 'Remessa',
  EMPRESTIMO: 'Empréstimo',
};

function getMovIcon(tipo: TipoMovimentacao) {
  switch (tipo) {
    case 'DESPESA':
      return <Receipt size={15} strokeWidth={1.75} className="text-[#DF4F52]" />;
    case 'REMESSA':
      return <ArrowDownLeft size={15} strokeWidth={1.75} className="text-[#0F273D]" />;
    case 'EMPRESTIMO':
      return <ArrowLeftRight size={15} strokeWidth={1.75} className="text-[#0F273D]" />;
  }
}

/**
 * Card 4 — Últimas Movimentações com filtros rápidos por tipo e período.
 */
export function MovimentacoesCard({ movimentacoes }: MovimentacoesCardProps) {
  const [tipoFiltro, setTipoFiltro] = useState<FiltroTipo>('TODOS');
  const [periodoFiltro, setPeriodoFiltro] = useState<FiltroPeriodo>('TODOS');

  const filtradas = useMemo(() => {
    const now = new Date();
    const cutoffMs =
      periodoFiltro === '30D'
        ? now.getTime() - 30 * 24 * 60 * 60 * 1000
        : periodoFiltro === '90D'
          ? now.getTime() - 90 * 24 * 60 * 60 * 1000
          : null;

    return [...movimentacoes]
      .filter((item) => {
        if (tipoFiltro !== 'TODOS' && item.tipo !== tipoFiltro) return false;
        if (cutoffMs !== null && item.data) {
          const itemTime = new Date(`${item.data.slice(0, 10)}T00:00:00`).getTime();
          if (!Number.isNaN(itemTime) && itemTime < cutoffMs) return false;
        }
        return true;
      })
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  }, [movimentacoes, tipoFiltro, periodoFiltro]);

  return (
    <section className="bg-white border border-[#C6D2D0] rounded-xl p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={18} strokeWidth={1.75} className="text-[#0F273D]" />
          <h2 className="text-lg font-semibold text-[#0F273D] font-display">
            Últimas Movimentações
          </h2>
        </div>

        <select
          aria-label="Filtrar por período"
          value={periodoFiltro}
          onChange={(e) => setPeriodoFiltro(e.target.value as FiltroPeriodo)}
          className="bg-white border border-[#C6D2D0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#0F273D] focus:outline-none focus:border-[#0F273D]"
        >
          <option value="TODOS">Todo o período</option>
          <option value="30D">Últimos 30 dias</option>
          <option value="90D">Últimos 90 dias</option>
        </select>
      </div>

      {/* Filtros rápidos de tipo */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { key: 'TODOS', label: 'Todos' },
            { key: 'DESPESA', label: 'Despesas' },
            { key: 'REMESSA', label: 'Entradas / Remessas' },
            { key: 'EMPRESTIMO', label: 'Empréstimos' },
          ] as { key: FiltroTipo; label: string }[]
        ).map((tab) => {
          const active = tipoFiltro === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTipoFiltro(tab.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0F273D] text-white'
                  : 'bg-[#ECF6F4] text-[#0F273D] hover:bg-[#C6D2D0]/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Lista de movimentações */}
      {filtradas.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#748598]">
          Nenhuma movimentação encontrada para os filtros selecionados.
        </div>
      ) : (
        <ul className="divide-y divide-[#C6D2D0]/50 max-h-80 overflow-y-auto pr-1">
          {filtradas.slice(0, 12).map((mov) => (
            <li
              key={mov.id}
              className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    mov.ehEntrada ? 'bg-[#2CE078]/15' : 'bg-[#DF4F52]/10'
                  }`}
                >
                  {getMovIcon(mov.tipo)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0F273D] truncate">{mov.descricao}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#748598] tabular-nums">
                      {formatDateBR(mov.data)}
                    </span>
                    <Badge variant={mov.ehEntrada ? 'success' : 'neutral'} className="text-[11px]">
                      {TIPO_LABEL[mov.tipo]} · {mov.origemOuRubrica}
                    </Badge>
                  </div>
                </div>
              </div>

              <span
                className={`text-sm font-bold tabular-nums shrink-0 ${
                  mov.ehEntrada ? 'text-[#0F273D]' : 'text-[#DF4F52]'
                }`}
              >
                {mov.ehEntrada ? '+' : '-'} {formatCurrencyBRL(mov.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
