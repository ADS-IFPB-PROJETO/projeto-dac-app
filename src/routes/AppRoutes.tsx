import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjetosHub } from '@/pages/ProjetosHub';
import { CadastroProjeto } from '@/pages/CadastroProjeto';
import { DashboardProjeto } from '@/pages/DashboardProjeto';
import { OrcamentoProjeto } from '@/pages/OrcamentoProjeto';
import { NovaMovimentacao } from '@/pages/NovaMovimentacao';
import { EmprestimosProjeto } from '@/pages/EmprestimosProjeto';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projetos" replace />} />
        <Route path="/projetos" element={<ProjetosHub />} />
        <Route path="/projetos/novo" element={<CadastroProjeto />} />
        <Route path="/projetos/:id/editar" element={<CadastroProjeto />} />
        <Route path="/projetos/:id" element={<DashboardProjeto />} />
        <Route path="/projetos/:id/orcamento" element={<OrcamentoProjeto />} />
        <Route path="/projetos/:id/movimentacoes/nova" element={<NovaMovimentacao />} />
        <Route path="/projetos/:id/emprestimos" element={<EmprestimosProjeto />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/projetos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
