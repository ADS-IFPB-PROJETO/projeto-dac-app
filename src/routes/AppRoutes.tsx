import { CadastroProjeto } from "@/pages/CadastroProjeto";
import { CadastroUsuario } from "@/pages/CadastroUsuario";
import { DashboardProjeto } from "@/pages/DashboardProjeto";
import { EmprestimosProjeto } from "@/pages/EmprestimosProjeto";
import { Login } from "@/pages/Login";
import { NovaMovimentacao } from "@/pages/NovaMovimentacao";
import { OrcamentoProjeto } from "@/pages/OrcamentoProjeto";
import { ProjetosHub } from "@/pages/ProjetosHub";
import { PrivateRoute } from "@/components/layout/PrivateRoute";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/cadastro" element={<CadastroUsuario />} />
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Navigate to="/projetos" replace />} />
          <Route path="/projetos" element={<ProjetosHub />} />
          <Route path="/projetos/novo" element={<CadastroProjeto />} />
          <Route path="/projetos/:id/editar" element={<CadastroProjeto />} />
          <Route path="/projetos/:id" element={<DashboardProjeto />} />
          <Route path="/projetos/:id/orcamento" element={<OrcamentoProjeto />} />
          <Route
            path="/projetos/:id/movimentacoes/nova"
            element={<NovaMovimentacao />}
          />
          <Route
            path="/projetos/:id/emprestimos"
            element={<EmprestimosProjeto />}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/projetos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
