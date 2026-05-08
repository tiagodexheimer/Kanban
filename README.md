# ClickUp Pessoal - Módulo Kanban

Documentação estratégica e técnica para o desenvolvimento do sistema de gerenciamento de tarefas.

---

## 🎯 Definição de MVP (Minimum Viable Product)
Funcionalidades essenciais para a primeira versão funcional:
- [ ] **Gestão de Boards:** Criação, edição e exclusão de quadros de trabalho.
- [ ] **Colunas Dinâmicas:** Adição de listas (To Do, Doing, Done) com suporte a reordenação.
- [ ] **Cartões (Cards):** Criação de tarefas com título, descrição e etiquetas.
- [ ] **Drag-and-Drop:** Movimentação fluida de cartões entre colunas e reordenação interna.
- [ ] **Persistência:** Salvamento automático de todas as alterações em banco de dados.
- [ ] **Interface Responsiva:** Design moderno focado em usabilidade desktop.

---

## 🏗️ Estrutura de Dados
Definição das entidades principais e seus relacionamentos:

### 1. Board (Quadro)
- `id`: UUID (Primary Key)
- `title`: String (obrigatório)
- `description`: Text (opcional)
- `themeColor`: String (hexadecimal para personalização)
- `createdAt` / `updatedAt`: DateTime

### 2. List / Column (Lista)
- `id`: UUID
- `boardId`: UUID (Foreign Key)
- `title`: String
- `position`: Integer (para ordenação das colunas)
- `createdAt` / `updatedAt`: DateTime

### 3. Card (Cartão)
- `id`: UUID
- `listId`: UUID (Foreign Key)
- `title`: String
- `description`: Text
- `position`: Integer (para ordenação dentro da lista)
- `priority`: Enum (Low, Medium, High, Urgent)
- `tags`: Array of Strings
- `dueDate`: DateTime (opcional)
- `createdAt` / `updatedAt`: DateTime

---

## 📅 Planejamento de Sprints

### **Sprint 1: UI/UX & Movimentação Visual (Semana 1)**
Foco em entregar uma experiência de uso "snappy" e visualmente atraente.
- [x] Configuração do ambiente e Design System (Cores, Tipografia).
- [x] Implementação do Layout Base (Sidebar + Board Canvas).
- [x] Componentização de Colunas e Cards.
- [x] Implementação de Drag-and-Drop (DND) com estado local.
- [x] Modais de criação e edição rápida.

### **Sprint 2: Backend, API & Persistência (Semana 2)**
Foco em tornar o sistema resiliente e funcional.
- [x] Modelagem do banco de dados e configuração do ORM (Prisma).
- [x] Desenvolvimento da API REST/GraphQL para CRUD de Boards, Lists e Cards.
- [x] Integração do Frontend com a API (Fetch/TanStack Query).
- [x] Implementação de "Optimistic Updates" para o DND não parecer lento.
- [x] Finalização do fluxo de persistência e tratamento de erros (Notificações Sonner).

### **Sprint 3: Atributos Avançados & Tags (Semana 3)**
Foco em enriquecer a informação de cada tarefa.
- [x] Sistema de Tags coloridas e gerenciáveis.
- [x] Checklists dentro dos cards com progresso visual.
- [x] Datas de entrega (Due Dates) com alertas visuais de atraso.

### **Sprint 4: Multi-visualizações & Filtros (Semana 4)**
Aumentar a versatilidade do workspace.
- [ ] Visualização em **Lista** (compacta e rápida).
- [ ] Visualização em **Calendário** para prazos.
- [ ] Sistema de filtros por prioridade, tags e busca textual.
- [ ] Ordenação personalizada (por data, prioridade, etc).

### **Sprint 5: Colaboração & Workspace (Semana 5)**
Transformar em uma ferramenta multi-usuário.
- [ ] Autenticação com NextAuth (Google, GitHub, E-mail).
- [ ] Atribuição de tarefas para diferentes membros da equipe.
- [ ] Comentários em tempo real dentro dos cards.
- [ ] Histórico de atividades (Activity Log).

### **Sprint 6: Automações & Dashboards (Semana 6)**
Inspirado na inteligência do ClickUp.
- [ ] Automações simples (ex: "Mover para Done ao concluir checklist").
- [ ] Dashboard com gráficos de Burn-down e produtividade.
- [ ] Dark/Light mode toggle avançado com temas customizáveis.

---

## 🚀 Backlog de Prioridades (Tarefa para Engenheiro)

1. [x] **Setup de Projeto:** Inicializar projeto com Framework moderno (Next.js), Tailwind CSS e configuração de diretórios.
2. [x] **Layout Estrutural:** Criar o Shell da aplicação com Sidebar de navegação e área de visualização do Board.
3. [x] **Board Component:** Desenvolver a visualização de um Board estático consumindo um JSON mockado de colunas e tarefas.
4. [x] **DND Engine:** Integrar biblioteca de movimentação (Drag-and-Drop) para permitir arrastar cards entre colunas.
5. [x] **Formulários de Entrada:** Criar componentes de "Quick Add" para novas listas e novos cartões diretamente na interface.

---

## 🛠️ Análise Técnica (Engenheiro Senior)

### **Stack Sugerida**
- **Frontend:** Next.js 16 (App Router) + TypeScript.
- **Styling:** Tailwind CSS + Shadcn/UI.
- **DND:** `@dnd-kit/core`.
- **Backend/ORM:** Prisma ORM.
- **Banco de Dados:** PostgreSQL (Supabase ou Docker).
- **State Management:** TanStack Query.

### **Estrutura de Arquivos**
```text
src/
├── app/                  # Next.js App Router
├── components/
│   ├── ui/               # Componentes base (shadcn)
│   ├── board/            # Board, Column, Card components
│   └── layout/           # Sidebar, Navbar
├── lib/
│   ├── prisma.ts         # Instância do cliente DB
│   └── utils.ts
├── store/                # Estados locais (Zustand se necessário)
└── types/                # Definições de TypeScript
```

### **Riscos Técnicos**
- **Race Conditions no DND:** Sincronização de posições no banco de dados.
- **Performance:** Renderização excessiva de componentes em boards grandes.

---

## 🧪 Estratégia de QA
- **DND Snapping:** Validar retorno do card em drops inválidos.
- **Markdown Support:** Garantir que descrições aceitem formatação.
- **Responsividade:** Testar scroll horizontal em resoluções < 1024px.
