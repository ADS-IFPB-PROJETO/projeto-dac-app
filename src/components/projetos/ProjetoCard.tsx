import React from 'react';
import { FolderKanban, Pencil, Eye, Users } from 'lucide-react';
import { ProjetoResDto } from '@/services/api';
import { formatCurrencyBRL, formatVigencia } from '@/utils/formatters';

export type ProjetoStatus = 'Ativo' | 'Concluído' | 'Em Atraso';

export interface ProjetoCardItem extends ProjetoResDto {
  tipo?: 'Edital' | 'Terceirizado' | string;
  status?: ProjetoStatus;
  membrosIniciais?: string[];
}

interface ProjetoCardProps {
  projeto: ProjetoCardItem;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onManageMembers: (id: number) => void;
}

/**
 * Card de Projeto da Tela Inicial seguindo .context/identidade-visual.md (seção 5.1).
 */
export function ProjetoCard({
  projeto,
  onView,
  onEdit,
  onManageMembers,
}: ProjetoCardProps) {
  const membros = projeto.membrosIniciais ?? ['JS', 'MA'];
  const tipoLabel = projeto.tipo ?? (projeto.financiador ? 'Edital' : 'Terceirizado');

  return (
    <div className="bg-white border border-[#C6D2D0] rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between gap-3.5">
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-[10px] bg-[#ECF6F4] flex items-center justify-center text-[#0F273D] shrink-0">
            <FolderKanban size={20} />
          </div>
          <h3
            className="font-semibold text-base text-[#0F273D] line-clamp-2 leading-snug"
            title={projeto.nome}
          >
            {projeto.nome}
          </h3>
        </div>

        <span className="shrink-0 bg-[#ECF6F4] text-[#0F273D] text-xs font-medium px-2.5 py-1 rounded-full">
          {tipoLabel}
        </span>
      </div>

      {/* Bloco de Métricas (2 colunas internas) */}
      <div className="grid grid-cols-2 gap-4 py-1 border-y border-[#F5FAF9]">
        <div>
          <span className="block text-xs font-medium text-[#748598] mb-0.5">
            Orçamento Total
          </span>
          <span className="text-[15px] font-bold text-[#0F273D] tabular-nums">
            {formatCurrencyBRL(projeto.valor)}
          </span>
        </div>

        <div>
          <span className="block text-xs font-medium text-[#748598] mb-0.5">
            Vigência
          </span>
          <span className="text-sm font-medium text-[#0F273D] tabular-nums truncate block">
            {formatVigencia(projeto.dataInicio, projeto.dataFim)}
          </span>
        </div>
      </div>

      {/* Descrição (máximo 2 linhas) */}
      <p className="text-[13px] text-[#748598] line-clamp-2 min-h-[36px] leading-relaxed">
        {projeto.descricao || 'Sem descrição cadastrada para este projeto.'}
      </p>

      {/* Rodapé do Card */}
      <div className="flex items-center justify-between pt-2 border-t border-[#F5FAF9]">
        {/* Avatares dos membros sobrepostos */}
        <div className="flex items-center -space-x-2">
          {membros.slice(0, 4).map((initials, idx) => (
            <div
              key={`${projeto.id}-membro-${idx}`}
              className="w-7 h-7 rounded-full bg-[#0F273D] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
              title={`Membro ${initials}`}
            >
              {initials}
            </div>
          ))}
          {membros.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-[#ECF6F4] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#0F273D]">
              +{membros.length - 4}
            </div>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(projeto.id)}
            className="p-1.5 text-[#748598] hover:text-[#0F273D] hover:bg-[#ECF6F4] rounded-lg transition-colors"
            title="Editar projeto"
          >
            <Pencil size={17} />
          </button>
          <button
            type="button"
            onClick={() => onView(projeto.id)}
            className="p-1.5 text-[#748598] hover:text-[#0F273D] hover:bg-[#ECF6F4] rounded-lg transition-colors"
            title="Visualizar dashboard"
          >
            <Eye size={18} />
          </button>
          <button
            type="button"
            onClick={() => onManageMembers(projeto.id)}
            className="p-1.5 text-[#748598] hover:text-[#0F273D] hover:bg-[#ECF6F4] rounded-lg transition-colors"
            title="Gerenciar membros"
          >
            <Users size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
