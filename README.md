# ORCA — Front-end (Web)

Sistema de Monitoramento de Execução para gestão de projetos orçamentários, serviços terceirizados e editais públicos.

Construído com **React**, **TypeScript**, **Vite** e **Tailwind CSS**.

---

## 🚀 Tecnologias

- **React 19** + **TypeScript**
- **Vite** (bundler de alta performance)
- **Tailwind CSS** (estilização utilitária e tokens de design)
- **React Router 7** (roteamento SPA)
- **Lucide React** (iconografia padrão)
- **Axios** (cliente HTTP com interceptors JWT)

---

## 📦 Como Executar

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar em ambiente de desenvolvimento
```bash
npm run dev
```
Acesse no navegador: `http://localhost:5173`

### 3. Gerar build de produção
```bash
npm run build
```

### 4. Visualizar o build localmente
```bash
npm run preview
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/       # Topbar, Navbar, etc.
│   ├── projetos/     # Componentes específicos de projetos (ex: ProjetoCard)
│   └── ui/           # Componentes base reutilizáveis (Button, Input, Badge)
├── constants/        # Tokens de cores e espaçamentos (orcaTheme.ts)
├── pages/            # Telas principais (ex: ProjetosHub)
├── routes/           # Configuração de rotas (AppRoutes.tsx)
├── services/         # Clientes de API e comunicação HTTP (api.ts)
└── utils/            # Utilitários (formatters, cn)
```
