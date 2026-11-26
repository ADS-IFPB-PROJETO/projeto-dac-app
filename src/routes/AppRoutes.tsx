import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjetosHub } from '@/pages/ProjetosHub';
import { CadastroProjeto } from '@/pages/CadastroProjeto';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projetos" replace />} />
        <Route path="/projetos" element={<ProjetosHub />} />
        <Route path="/projetos/novo" element={<CadastroProjeto />} />
        <Route path="/projetos/:id/editar" element={<CadastroProjeto />} />
        <Route
          path="/projetos/:id"
          element={
            <div className="min-h-screen bg-[#ECF6F4] p-8">
              <h1 className="text-xl font-bold text-[#0F273D]">T05 - Dashboard do Projeto (Em breve)</h1>
              <a href="/projetos" className="text-[#0F273D] underline mt-4 inline-block">Voltar aos projetos</a>
            </div>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/projetos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
