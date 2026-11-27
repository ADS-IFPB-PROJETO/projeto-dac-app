import React from 'react';
import { Search, Bell, PieChart, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

interface TopbarProps {
  userName?: string;
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onPressProfile?: () => void;
  onPressNotifications?: () => void;
}

function getUserNameFromToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('@orca:token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(json) as { nome?: string; name?: string; sub?: string };
    if (payload.nome) return payload.nome;
    if (payload.name) return payload.name;
    if (payload.sub) return payload.sub.split('@')[0];
    return null;
  } catch {
    return null;
  }
}

/**
 * Barra superior global do ORCA (64px, fundo #0F273D).
 */
export function Topbar({
  userName,
  searchQuery = '',
  onSearchChange,
  onPressProfile,
  onPressNotifications,
}: TopbarProps) {
  const navigate = useNavigate();

  const resolvedName = getUserNameFromToken() || userName || 'Usuário';

  const initials = resolvedName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  async function handleLogout() {
    try {
      await api.post('/v1/auth/logout');
    } catch {
      // Ignora falha de rede no logout e limpa a sessão local
    } finally {
      localStorage.removeItem('@orca:token');
      navigate('/login', { replace: true });
    }
  }

  return (
    <header className="h-16 bg-[#0F273D] border-b border-white/10 px-5 sticky top-0 z-40 flex items-center">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Esquerda: Logo ORCA */}
        <div
          onClick={() => navigate('/projetos')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2CE078] flex items-center justify-center text-[#0F273D] shadow-sm group-hover:scale-105 transition-transform">
            <PieChart size={18} strokeWidth={2.5} />
          </div>
          <span className="text-white text-lg font-bold tracking-wider font-display">
            ORCA
          </span>
        </div>

        {/* Centro: Barra de busca global */}
        {onSearchChange && (
          <div className="hidden sm:flex flex-1 max-w-md mx-4 relative items-center">
            <Search className="absolute left-3 text-[#748598]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Pesquisar projetos, coordenadores ou órgãos..."
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-[#0F273D] placeholder-[#748598] text-sm rounded-lg pl-9 pr-3 py-1.5 border border-transparent focus:border-white/20 transition-all outline-none"
            />
          </div>
        )}

        {/* Direita: Notificações, Perfil e Saudação */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPressNotifications}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
            title="Notificações"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2CE078] rounded-full" />
          </button>

          <button
            type="button"
            onClick={onPressProfile || (() => navigate('/perfil'))}
            className="flex items-center gap-2.5 p-1 hover:bg-white/10 rounded-full sm:rounded-lg transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#1A3B59] border border-[#2CE078] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials || 'U'}
            </div>
            <div className="hidden sm:block">
              <span className="text-white text-sm font-medium block leading-tight">
                Olá, {resolvedName.split(' ')[0]}
              </span>
              <span className="text-[#748598] text-xs block leading-tight">
                Meu Perfil
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Sair da conta"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
