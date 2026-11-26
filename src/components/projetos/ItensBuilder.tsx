import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Folder,
  FolderOpen,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { formatCurrencyBRL } from '@/utils/formatters';

export interface RubricaNode {
  localId: string;
  descricao: string;
  valorPrevisto: string; // string controlada para input numérico
  isOpen: boolean;
  filhas: RubricaNode[];
}

export function createEmptyRubrica(isOpen = false): RubricaNode {
  const randomId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    localId: randomId,
    descricao: '',
    valorPrevisto: '',
    isOpen,
    filhas: [],
  };
}

/**
 * Calcula recursivamente o valor previsto de uma rubrica seguindo o padrão Composite:
 * - Rubrica mãe (com filhas) não possui valor próprio: retorna a soma das filhas.
 * - Rubrica folha (sem filhas) retorna seu próprio valorPrevisto.
 */
export function calcularValorRubrica(node: RubricaNode): number {
  if (node.filhas.length > 0) {
    return node.filhas.reduce((acc, child) => acc + calcularValorRubrica(child), 0);
  }
  const parsed = Number(node.valorPrevisto.replace(',', '.'));
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export function calcularTotalRubricas(nodes: RubricaNode[]): number {
  return nodes.reduce((acc, node) => acc + calcularValorRubrica(node), 0);
}

interface RubricasBuilderProps {
  rubricas: RubricaNode[];
  onChange: (next: RubricaNode[]) => void;
  orcamentoTotal: number;
}

interface RubricaItemCardProps {
  node: RubricaNode;
  numeracao: string;
  depth: number;
  onUpdateNode: (localId: string, updater: (node: RubricaNode) => RubricaNode) => void;
  onRemoveNode: (localId: string) => void;
  onAddChild: (parentId: string) => void;
}

function RubricaItemCard({
  node,
  numeracao,
  depth,
  onUpdateNode,
  onRemoveNode,
  onAddChild,
}: RubricaItemCardProps) {
  const isComposite = node.filhas.length > 0;
  const valorCalculado = calcularValorRubrica(node);
  const nextChildNumber = `${numeracao}${node.filhas.length + 1}.`;

  return (
    <div
      className="rounded-xl border border-[#C6D2D0] bg-white overflow-hidden transition-shadow hover:shadow-sm"
    >
      {/* Corpo principal da rubrica */}
      <div className="p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
          {/* Numeração + Ícone */}
          <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F273D] text-white text-xs font-bold tabular-nums">
              {isComposite ? (
                <FolderOpen size={13} strokeWidth={1.75} />
              ) : (
                <Folder size={13} strokeWidth={1.75} />
              )}
              {numeracao}
            </span>
          </div>

          {/* Descrição da rubrica */}
          <input
            type="text"
            value={node.descricao}
            onChange={(e) =>
              onUpdateNode(node.localId, (curr) => ({
                ...curr,
                descricao: e.target.value,
              }))
            }
            placeholder={
              isComposite
                ? 'Nome do item agrupador (ex.: Equipamentos)'
                : 'Descrição do item (ex.: Notebook de pesquisa)'
            }
            className="flex-1 min-w-0 h-9 bg-[#F5FAF9] border border-[#C6D2D0] rounded-lg px-3 text-sm text-[#0F273D] placeholder:text-[#748598] focus:outline-none focus:bg-white focus:border-[#0F273D] transition-colors"
          />

          {/* Valor: calculado se mãe (Composite), editável se folha (Leaf) */}
          <div className="flex items-center gap-2 sm:w-44 shrink-0">
            {isComposite ? (
              <div
                className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-[#ECF6F4] border border-[#C6D2D0] flex items-center justify-between gap-1"
                title="Item mãe: valor calculado automaticamente pela soma dos filhos"
              >
                <span className="text-[11px] font-medium text-[#748598]">Soma</span>
                <span className="text-sm font-bold text-[#0F273D] tabular-nums truncate">
                  {formatCurrencyBRL(valorCalculado)}
                </span>
              </div>
            ) : (
              <div className="relative flex-1 min-w-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#748598]">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={node.valorPrevisto}
                  onChange={(e) =>
                    onUpdateNode(node.localId, (curr) => ({
                      ...curr,
                      valorPrevisto: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                  className="w-full h-9 pl-9 pr-2 bg-white border border-[#C6D2D0] rounded-lg text-sm font-medium text-[#0F273D] tabular-nums placeholder:text-[#748598] focus:outline-none focus:border-[#0F273D]"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => onRemoveNode(node.localId)}
              className="p-2 text-[#748598] hover:text-[#DF4F52] hover:bg-[#DF4F52]/10 rounded-lg transition-colors shrink-0"
              aria-label={`Remover item ${numeracao}`}
              title="Remover item"
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {isComposite && (
          <p className="text-xs text-[#748598]">
            Item mãe: não possui valor próprio — seu valor é a soma dos{' '}
            <strong className="text-[#0F273D]">{node.filhas.length}</strong> sub-iten(s) abaixo.
          </p>
        )}
      </div>

      {/* Área expansível animada para rubricas filhas (abre ao clicar na parte inferior) */}
      <div
        className={`grid transition-all duration-300 ease-out ${node.isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 bg-[#F5FAF9] border-t border-[#C6D2D0]/60 space-y-3">
            {node.filhas.length > 0 && (
              <div className="space-y-2.5 pl-2 border-l-2 border-[#0F273D]/25">
                {node.filhas.map((child, idx) => (
                  <RubricaItemCard
                    key={child.localId}
                    node={child}
                    numeracao={`${numeracao}${idx + 1}.`}
                    depth={depth + 1}
                    onUpdateNode={onUpdateNode}
                    onRemoveNode={onRemoveNode}
                    onAddChild={onAddChild}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onAddChild(node.localId)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F273D] bg-white hover:bg-[#ECF6F4] border border-dashed border-[#0F273D]/40 rounded-lg px-3 py-2 transition-colors"
            >
              <Plus size={14} strokeWidth={2} />
              Adicionar item filho ({nextChildNumber})
            </button>
          </div>
        </div>
      </div>

      {/* Parte inferior clicável estilo "pasta" para abrir/fechar sub-rubricas */}
      <button
        type="button"
        onClick={() =>
          onUpdateNode(node.localId, (curr) => ({
            ...curr,
            isOpen: !curr.isOpen,
          }))
        }
        className="w-full px-4 py-2 bg-[#ECF6F4]/70 hover:bg-[#ECF6F4] border-t border-[#C6D2D0]/70 flex items-center justify-between text-xs font-medium text-[#0F273D] transition-colors"
      >
        <span className="inline-flex items-center gap-1.5">
          {node.isOpen ? (
            <FolderOpen size={14} strokeWidth={1.75} />
          ) : (
            <Folder size={14} strokeWidth={1.75} />
          )}
          {node.isOpen
            ? 'Recolher sub-itens'
            : node.filhas.length > 0
              ? `Abrir sub-itens (${node.filhas.length})`
              : 'Clique aqui para abrir e adicionar item filho'}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.75}
          className={`transition-transform duration-300 ${node.isOpen ? 'rotate-180' : 'rotate-0'
            }`}
        />
      </button>
    </div>
  );
}

export function RubricasBuilder({
  rubricas,
  onChange,
  orcamentoTotal,
}: RubricasBuilderProps) {
  const totalRubricas = calcularTotalRubricas(rubricas);
  const diferenca = orcamentoTotal - totalRubricas;
  const excedeuOrcamento = totalRubricas > orcamentoTotal;
  const sobraOrcamento = orcamentoTotal > totalRubricas && rubricas.length > 0;
  const orcamentoExato =
    orcamentoTotal > 0 && Math.abs(diferenca) < 0.005 && rubricas.length > 0;

  const updateInTree = (
    nodes: RubricaNode[],
    targetId: string,
    updater: (n: RubricaNode) => RubricaNode
  ): RubricaNode[] =>
    nodes.map((n) => {
      if (n.localId === targetId) {
        return updater(n);
      }
      if (n.filhas.length > 0) {
        return { ...n, filhas: updateInTree(n.filhas, targetId, updater) };
      }
      return n;
    });

  const removeFromTree = (nodes: RubricaNode[], targetId: string): RubricaNode[] =>
    nodes
      .filter((n) => n.localId !== targetId)
      .map((n) => ({
        ...n,
        filhas: removeFromTree(n.filhas, targetId),
      }));

  const handleUpdateNode = (
    localId: string,
    updater: (node: RubricaNode) => RubricaNode
  ) => {
    onChange(updateInTree(rubricas, localId, updater));
  };

  const handleRemoveNode = (localId: string) => {
    onChange(removeFromTree(rubricas, localId));
  };

  const handleAddRoot = () => {
    onChange([...rubricas, createEmptyRubrica(false)]);
  };

  const handleAddChild = (parentId: string) => {
    onChange(
      updateInTree(rubricas, parentId, (parent) => ({
        ...parent,
        isOpen: true,
        valorPrevisto: '', // Rubrica mãe não possui valor próprio
        filhas: [...parent.filhas, createEmptyRubrica(false)],
      }))
    );
  };

  return (
    <section className="bg-white border border-[#C6D2D0] rounded-xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0F273D] flex items-center gap-2">
            <Layers size={18} strokeWidth={1.75} />
            2. Itens de Orçamento
          </h2>
          <p className="text-sm text-[#748598] mt-1">
            Estruture os itens em árvore. Itens mães somam automaticamente seus filhos.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleAddRoot}
          className="shrink-0"
        >
          <Plus size={16} strokeWidth={1.75} />
          Novo item ({rubricas.length + 1}.)
        </Button>
      </div>

      {/* Resumo Orçamento vs Rubricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F5FAF9] border border-[#C6D2D0] rounded-xl p-4">
        <div>
          <span className="text-xs font-medium text-[#748598]">
            Orçamento do Projeto
          </span>
          <p className="text-base font-bold text-[#0F273D] tabular-nums">
            {formatCurrencyBRL(orcamentoTotal)}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-[#748598]">
            Soma Total dos Itens
          </span>
          <p
            className={`text-base font-bold tabular-nums ${excedeuOrcamento ? 'text-[#DF4F52]' : 'text-[#0F273D]'
              }`}
          >
            {formatCurrencyBRL(totalRubricas)}
          </p>
        </div>
      </div>

      {/* Alertas de comparação entre soma das rubricas e orçamento */}
      {excedeuOrcamento && (
        <div
          role="alert"
          className="flex items-start gap-2.5 bg-[#DF4F52]/10 border border-[#DF4F52] text-[#DF4F52] rounded-lg px-4 py-3 text-sm"
        >
          <AlertCircle size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              O valor total dos itens é maior que o orçamento informado.
            </p>
            <p className="text-xs mt-0.5 tabular-nums">
              Excedente de {formatCurrencyBRL(totalRubricas - orcamentoTotal)}. Ajuste os
              itens ou aumente o orçamento do projeto para continuar.
            </p>
          </div>
        </div>
      )}

      {sobraOrcamento && (
        <div
          role="status"
          className="flex items-start gap-2.5 bg-[#DDA64B]/15 border border-[#DDA64B] text-[#0F273D] rounded-lg px-4 py-3 text-sm"
        >
          <AlertTriangle
            size={18}
            strokeWidth={1.75}
            className="shrink-0 mt-0.5 text-[#DDA64B]"
          />
          <div>
            <p className="font-semibold">
              Orçamento maior que o valor total dos itens
            </p>
            <p className="text-xs text-[#0F273D]/80 mt-0.5 tabular-nums">
              Ainda há {formatCurrencyBRL(diferenca)} disponíveis para alocar em itens.
            </p>
          </div>
        </div>
      )}

      {orcamentoExato && (
        <div className="flex items-center gap-2.5 bg-[#2CE078]/15 border border-[#2CE078] text-[#0F273D] rounded-lg px-4 py-2.5 text-sm">
          <CheckCircle2
            size={17}
            strokeWidth={1.75}
            className="shrink-0 text-[#0F273D]"
          />
          <span className="font-medium">
            100% do orçamento previsto foi distribuído nos itens.
          </span>
        </div>
      )}

      {/* Lista hierárquica de rubricas */}
      {rubricas.length === 0 ? (
        <div className="border border-dashed border-[#C6D2D0] rounded-xl p-6 text-center space-y-3 bg-[#F5FAF9]/50">
          <p className="text-sm text-[#748598]">
            Nenhum item adicionado ainda. Clique em <strong>Novo item</strong> para iniciar a estrutura orçamentária.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rubricas.map((node, index) => (
            <RubricaItemCard
              key={node.localId}
              node={node}
              numeracao={`${index + 1}.`}
              depth={0}
              onUpdateNode={handleUpdateNode}
              onRemoveNode={handleRemoveNode}
              onAddChild={handleAddChild}
            />
          ))}
        </div>
      )}
    </section>
  );
}
