# OmniTask

Documentação estratégica e técnica para o desenvolvimento do sistema de gerenciamento de tarefas.

---

## 🎯 Definição de MVP (Minimum Viable Product)
Funcionalidades essenciais para a primeira versão funcional:
- [x] **Gestão de Boards:** Criação, edição e exclusão de quadros de trabalho.
- [x] **Colunas Dinâmicas:** Adição de listas (To Do, Doing, Done) com suporte a reordenação.
- [x] **Cartões (Cards):** Criação de tarefas com título, descrição e etiquetas.
- [x] **Drag-and-Drop:** Movimentação fluida de cartões entre colunas e reordenação interna.
- [x] **Persistência:** Salvamento automático de todas as alterações em banco de dados.
- [x] **Interface Responsiva:** Design moderno focado em usabilidade desktop.

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
- [x] Visualização em **Lista** (compacta e rápida).
- [x] Visualização em **Calendário** para prazos.
- [x] Sistema de filtros por prioridade, tags e busca textual.
- [x] Ordenação personalizada (por data, prioridade, etc).

### **Sprint 5: Colaboração & Workspace (Semana 5)**
Transformar em uma ferramenta multi-usuário.
- [x] Autenticação com NextAuth (Google, GitHub, E-mail).
- [x] Gestão de múltiplos quadros (Workspace Switcher).
- [x] Atribuição de tarefas para diferentes membros da equipe.
- [x] Comentários em tempo real dentro dos cards.
- [x] Histórico de atividades (Activity Log).

### **Sprint 6: Automações & Dashboards (Semana 6)**
Inspirado na inteligência do ClickUp.
- [x] Dashboard com gráficos de Burn-down e produtividade.
- [x] Dark/Light mode toggle avançado com temas customizáveis.

### **Sprint 7: Flexibilidade & Estrutura (Semana 7)**
- [x] **Campos Customizados**: Adição de campos de texto, números ou dropdowns específicos por quadro. Permitir que o usuário adicione campos de texto, números, dinheiro ou dropdowns específicos para cada quadro.
- [x] **Hierarquia de Pastas**: O Criar uma camada acima dos quadros (Espaços -> Pastas -> Quadros), permitindo organizar múltiplos projetos. 
- [x] **Status Personalizados**: Definição de colunas e cores de status por quadro. Cada quadro pode ter seus próprios nomes de colunas e cores de status (ex: "Em Revisão", "Aguardando Cliente").

### **Sprint 8: Relacionamentos & Dependências (Semana 8)**
- [x] **Dependências de Tarefas**: Sistema de bloqueios ("Bloqueado por" / "Esperando por"). Marcar uma tarefa como "Bloqueada por" ou "Esperando por" outra tarefa.
- [x] **Relacionamentos entre Cards**: Lincar tarefas de quadros diferentes. Lincar cards de quadros diferentes (ex: um bug lincado a uma tarefa de desenvolvimento). 
- [x] **Subtarefas Aninhadas**: Suporte a subtarefas em múltiplos níveis. ermitir que subtarefas também tenham suas próprias subtarefas (recursividade).

### **Sprint 9: Docs & Conhecimento (Semana 9)**
- [x] **ClickUp Docs**: Editor de texto rico (Rich Text) para documentação interna.Um editor Rich Text (Slash commands, markdown) integrado para criar wikis e documentação de processos dentro do workspace.
- [x] **Whiteboards (Quadros Brancos)**: Uma área para desenho livre e diagramas (usando algo como Excalidraw ou Canvas API).
- [x] **Menções Globais**: Uso de `@` para referenciar membros ou tarefas em comentários.

### **Sprint 10: Gestão de Tempo & Recursos (Semana 10)**
- [ ] **Time Tracking**: Cronômetro integrado para registro de tempo por tarefa. Botão de "Play/Pause" dentro do card para registrar o tempo gasto na tarefa.
- [ ] **Carga de Trabalho**: Visualização da distribuição de tarefas entre membros. Um gráfico que mostra quantas tarefas cada membro da equipe tem atribuídas para evitar sobrecarga.
- [ ] **Exportação de Relatórios**: Gerar PDFs ou CSVs com o tempo gasto e tarefas concluídas no período.

### **Sprint 11: IA & Automações Avançadas (Semana 11)**
- [ ] **IA de Resumo**: Uso de IA para resumir comentários e gerar descrições. Integrar uma API de LLM (como Gemini ou OpenAI) para resumir longas threads de comentários ou gerar descrições de tarefas automaticamente.
- [ ] **Gatilhos de Tempo**: Automações baseadas em prazos e atrasos. Automações que disparam por data (ex: "Se a tarefa estiver atrasada, envie um alerta para o responsável").
- [ ] **Webhooks & Integrações**: Enviar notificações para Slack/Discord ou criar tarefas via e-mail.

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
