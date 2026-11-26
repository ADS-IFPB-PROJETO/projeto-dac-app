import React, { useState } from 'react';
import { UserPlus, Trash2, Users, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PapelProjeto, VinculoResponseDto } from '@/services/api';

interface EquipeCardProps {
  membros: VinculoResponseDto[];
  canManageTeam?: boolean;
  onAddMember: () => void;
  onRemoveMember: (idMembro: number) => Promise<void> | void;
}

const PAPEL_LABEL: Record<PapelProjeto, string> = {
  OWNER: 'Coordenador',
  MEMBER: 'Membro',
  VIEWER: 'Observador',
};

const PAPEL_VARIANT: Record<PapelProjeto, 'default' | 'success' | 'neutral'> = {
  OWNER: 'success',
  MEMBER: 'default',
  VIEWER: 'neutral',
};

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/**
 * Card 3 — Equipe do Projeto com lista de membros, papel e desassociação.
 */
export function EquipeCard({
  membros,
  canManageTeam = true,
  onAddMember,
  onRemoveMember,
}: EquipeCardProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function handleConfirmRemove(idMembro: number) {
    setRemovingId(idMembro);
    try {
      await onRemoveMember(idMembro);
    } finally {
      setRemovingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section className="bg-white border border-[#C6D2D0] rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} strokeWidth={1.75} className="text-[#0F273D]" />
            <h2 className="text-lg font-semibold text-[#0F273D] font-display">
              Equipe do Projeto
            </h2>
          </div>

          {canManageTeam && (
            <Button
              size="sm"
              variant="secondary"
              icon={<UserPlus size={15} strokeWidth={1.75} />}
              onClick={onAddMember}
            >
              Adicionar Membro
            </Button>
          )}
        </div>

        {membros.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#748598]">
            Nenhum membro associado a este projeto ainda.
          </div>
        ) : (
          <ul className="divide-y divide-[#C6D2D0]/50">
            {membros.map((membro) => {
              const isConfirming = confirmingId === membro.usuarioId;
              const isRemoving = removingId === membro.usuarioId;

              return (
                <li
                  key={membro.id}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#0F273D] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {getInitials(membro.nome) || 'M'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F273D] truncate">{membro.nome}</p>
                      <p className="text-xs text-[#748598] truncate">{membro.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={PAPEL_VARIANT[membro.papel]}>
                      {PAPEL_LABEL[membro.papel] ?? membro.papel}
                    </Badge>

                    {canManageTeam && membro.papel !== 'OWNER' && (
                      <>
                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => handleConfirmRemove(membro.usuarioId)}
                              title="Confirmar remoção"
                              className="p-1.5 rounded-md bg-[#DF4F52] text-white hover:opacity-90 disabled:opacity-50"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => setConfirmingId(null)}
                              title="Cancelar"
                              className="p-1.5 rounded-md bg-[#ECF6F4] text-[#0F273D] hover:bg-[#C6D2D0]/50"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingId(membro.usuarioId)}
                            title="Desassociar membro"
                            className="p-1.5 rounded-md text-[#748598] hover:text-[#DF4F52] hover:bg-[#DF4F52]/10 transition-colors"
                          >
                            <Trash2 size={15} strokeWidth={1.75} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
