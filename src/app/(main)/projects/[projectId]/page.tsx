"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStats } from "@/hooks/use-omnitask";
import { useTheme } from "@/components/providers/theme-provider";
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Briefcase, LayoutDashboard, Folder, Users, 
  CheckCircle2, Clock, BarChart3, PieChart as PieChartIcon, 
  ArrowUpRight, ListTodo, Plus, Shield, X, Trash2, ChevronRight, Inbox, Settings, LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ProjectSettingsModal } from "@/components/project/project-settings-modal";

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const router = useRouter();
  const { mode } = useTheme();

  const { data, isLoading, error } = useProjectStats(projectId);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const COLORS = ["#7c3aed", "#f59e0b", "#10b981"]; // Purple (Todo), Amber (In Progress), Done (Emerald)
  const PRIORITY_COLORS: Record<string, string> = {
    "Baixa": "#10b981",
    "Média": "#3b82f6",
    "Alta": "#f59e0b",
    "Urgente": "#f43f5e",
  };

  const PRIORITY_BADGES: Record<string, string> = {
    "Baixa": "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    "Média": "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    "Alta": "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    "Urgente": "bg-rose-500/10 text-rose-500 border border-rose-500/20",
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-medium">Carregando painel do projeto...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-6 px-4 text-center">
        <div className="p-4 bg-destructive/10 text-destructive rounded-full">
          <Briefcase size={40} />
        </div>
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <p className="text-muted-foreground max-w-md">O projeto que você está procurando não existe ou você não possui permissão de acesso.</p>
        <button 
          onClick={() => router.push("/")}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all font-bold"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const { 
    project, 
    stats, 
    boards, 
    members, 
    priorityDistribution, 
    statusDistribution,
    deadlineDistribution,
    overdueTasks,
    upcomingTasks
  } = data;

  // Transform workload data for Recharts
  const workloadData = members.map(m => ({
    name: m.user.name || m.user.email?.split("@")[0] || "Sem Nome",
    tarefas: m.tasksAssignedCount
  })).sort((a, b) => b.tarefas - a.tarefas);

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar h-full">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <Briefcase size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.title}</h1>
              <p className="text-muted-foreground mt-1 max-w-xl">{project.description || "Painel de controle com estatísticas, gerenciamento de backlog e acompanhamento em tempo real."}</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-accent text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 shadow-2xs self-start md:self-auto"
          >
            <Settings size={16} />
            Configurações
          </button>
        </header>

        <div className="space-y-8 animate-fadeIn">
            {/* Summary Statistics */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Boards */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quadros</p>
                    <h4 className="text-2xl font-bold mt-1">{stats.boardsCount}</h4>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-5 text-primary group-hover:scale-110 transition-transform">
                  <LayoutDashboard size={90} />
                </div>
              </div>

              {/* Total Folders */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 group-hover:scale-110 transition-transform">
                    <Folder size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pastas</p>
                    <h4 className="text-2xl font-bold mt-1">{stats.foldersCount}</h4>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-5 text-yellow-500 group-hover:scale-110 transition-transform">
                  <Folder size={90} />
                </div>
              </div>

              {/* Total Members */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Membros</p>
                    <h4 className="text-2xl font-bold mt-1">{stats.membersCount}</h4>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-5 text-blue-500 group-hover:scale-110 transition-transform">
                  <Users size={90} />
                </div>
              </div>

              {/* Total Tasks */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-xl text-green-500 group-hover:scale-110 transition-transform">
                    <ListTodo size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tarefas Totais</p>
                    <h4 className="text-2xl font-bold mt-1">{stats.tasksCount}</h4>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-5 text-green-500 group-hover:scale-110 transition-transform">
                  <ListTodo size={90} />
                </div>
              </div>
            </section>

            {/* Detailed Grid (Boards List with Members) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Boards List */}
              <div className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="text-primary" size={20} />
                    <h3 className="font-bold text-lg">Quadros do Projeto ({boards.length})</h3>
                  </div>
                </div>

                {boards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-2xl">
                    <LayoutDashboard size={48} className="text-muted-foreground/50 mb-3" />
                    <h4 className="font-bold">Nenhum quadro criado</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">Use o menu de configurações do projeto para gerenciar seus quadros.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Render active Boards */}
                    {boards.map((board) => {
                      const percent = board.totalTasks > 0 
                        ? Math.round((board.completedTasks / board.totalTasks) * 100)
                        : 0;

                      return (
                        <div key={board.id} className="p-4 rounded-2xl border border-border bg-accent/10 hover:bg-accent/20 transition-all flex flex-col justify-between group relative overflow-hidden">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-base truncate pr-6 group-hover:text-primary transition-colors">{board.title}</h4>
                              <Link 
                                href={`/boards/${board.id}`}
                                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                                title="Abrir quadro"
                              >
                                <ArrowUpRight size={16} />
                              </Link>
                            </div>
                            {board.description && board.description !== "Novo quadro criado" && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{board.description}</p>
                            )}
                          </div>

                          <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-muted-foreground">{percent}% Concluído</span>
                              <span className="text-foreground">{board.completedTasks}/{board.totalTasks} tarefas</span>
                            </div>
                            <div className="w-full bg-accent h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Members List */}
              <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <Users className="text-blue-500" size={20} />
                  <h3 className="font-bold text-lg">Membros da Equipe ({members.length})</h3>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between p-3 rounded-2xl bg-accent/10 border border-border/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                          {member.user.image ? (
                            <img src={member.user.image} alt={member.user.name || ""} className="w-full h-full object-cover" />
                          ) : (
                            (member.user.name || member.user.email || "U").substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{member.user.name || "Sem Nome"}</p>
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-0.5 mt-0.5">
                            <Shield size={10} />
                            {member.role === "OWNER" ? "Dono" : member.role === "ADMIN" ? "Admin" : member.role === "MEMBER" ? "Membro" : "Observador"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-foreground">{member.tasksAssignedCount}</p>
                        <p className="text-[10px] text-muted-foreground">tarefas atribuídas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Controle de Prazos e Alertas Críticos */}
            {stats.tasksCount > 0 && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de Status de Prazos */}
                <div className="bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <PieChartIcon className="text-red-500" size={20} />
                      <h3 className="font-bold text-lg">Controle de Prazos</h3>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-3 mb-6">Tarefas ativas do projeto agrupadas por proximidade do vencimento.</p>
                  </div>

                  <div className="h-[220px] w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={deadlineDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {deadlineDistribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.name === "Vencidas" 
                                  ? "#f43f5e" 
                                  : entry.name === "A Vencer (3d)" 
                                    ? "#f59e0b" 
                                    : "#10b981"
                              } 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "var(--card)", 
                            borderColor: "var(--border)", 
                            borderRadius: "12px",
                            fontSize: "12px"
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Donut Chart Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-extrabold text-foreground">
                        {overdueTasks.length + upcomingTasks.length}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Prazos Críticos</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mt-6">
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                      <span className="text-xs font-semibold text-red-500 block">Vencidas</span>
                      <span className="text-sm font-bold text-red-500">{overdueTasks.length}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-xs font-semibold text-amber-500 block">A Vencer</span>
                      <span className="text-sm font-bold text-amber-500">{upcomingTasks.length}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-xs font-semibold text-emerald-500 block">No Prazo</span>
                      <span className="text-sm font-bold text-emerald-500">
                        {deadlineDistribution.find(d => d.name === "No Prazo")?.value || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alertas de Prazos Críticos */}
                <div className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Clock className="text-red-500 animate-pulse" size={20} />
                      <h3 className="font-bold text-lg">Alertas de Prazos Críticos</h3>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {overdueTasks.length === 0 && upcomingTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl h-full">
                        <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
                        <h4 className="font-bold text-foreground">Excelente trabalho!</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">Nenhuma tarefa está vencida ou prestes a vencer nos próximos 3 dias.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Overdue Tasks List */}
                        {overdueTasks.map((task) => {
                          const daysDiff = Math.ceil((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 3600 * 24));
                          return (
                            <div key={task.id} className="p-3.5 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Vencida</span>
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={`Quadro: ${task.boardTitle}`}>
                                    {task.boardTitle}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-foreground">{task.title}</h4>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-4">
                                <div className="text-left md:text-right">
                                  <span className="text-xs font-bold text-red-500 block">
                                    Vencida há {daysDiff} {daysDiff === 1 ? "dia" : "dias"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Vencimento: {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>

                                <div className="flex -space-x-2">
                                  {task.assignees.map((assignee) => (
                                    <div 
                                      key={assignee.id} 
                                      className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-extrabold text-primary border-2 border-background overflow-hidden"
                                      title={assignee.name || assignee.email || undefined}
                                    >
                                      {assignee.image ? (
                                        <img src={assignee.image} alt={assignee.name || ""} className="w-full h-full object-cover" />
                                      ) : (
                                        (assignee.name || assignee.email || "U").substring(0, 2).toUpperCase()
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <Link 
                                  href={`/boards/${task.boardId}`}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all shrink-0"
                                  title="Abrir quadro"
                                >
                                  <ArrowUpRight size={16} />
                                </Link>
                              </div>
                            </div>
                          );
                        })}

                        {/* Upcoming Tasks List */}
                        {upcomingTasks.map((task) => {
                          const nowTime = new Date().getTime();
                          const dueTime = new Date(task.dueDate).getTime();
                          const hoursDiff = Math.round((dueTime - nowTime) / (1000 * 3600));
                          const daysDiff = Math.ceil(hoursDiff / 24);
                          
                          return (
                            <div key={task.id} className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-wider">A Vencer</span>
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={`Quadro: ${task.boardTitle}`}>
                                    {task.boardTitle}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-foreground">{task.title}</h4>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-4">
                                <div className="text-left md:text-right">
                                  <span className="text-xs font-bold text-amber-500 block">
                                    {daysDiff <= 0 
                                      ? "Vence hoje" 
                                      : daysDiff === 1 
                                        ? "Vence amanhã" 
                                        : `Vence em ${daysDiff} dias`}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Vencimento: {new Date(task.dueDate).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>

                                <div className="flex -space-x-2">
                                  {task.assignees.map((assignee) => (
                                    <div 
                                      key={assignee.id} 
                                      className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-extrabold text-primary border-2 border-background overflow-hidden"
                                      title={assignee.name || assignee.email || undefined}
                                    >
                                      {assignee.image ? (
                                        <img src={assignee.image} alt={assignee.name || ""} className="w-full h-full object-cover" />
                                      ) : (
                                        (assignee.name || assignee.email || "U").substring(0, 2).toUpperCase()
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <Link 
                                  href={`/boards/${task.boardId}`}
                                  className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-500 transition-all shrink-0"
                                  title="Abrir quadro"
                                >
                                  <ArrowUpRight size={16} />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Charts Section */}
            {stats.tasksCount > 0 && (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 mb-8">
                    <PieChartIcon className="text-blue-500" size={20} />
                    <h3 className="font-bold text-lg">Distribuição por Status</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "var(--card)", 
                            borderColor: "var(--border)", 
                            borderRadius: "12px",
                            fontSize: "12px"
                          }} 
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Member Workload */}
                <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 mb-8">
                    <BarChart3 className="text-amber-500" size={20} />
                    <h3 className="font-bold text-lg">Distribuição de Carga de Trabalho (Tarefas por Usuário)</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={workloadData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={mode === "dark" ? "#27272a" : "#e2e8f0"} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "var(--card)", 
                            borderColor: "var(--border)", 
                            borderRadius: "12px",
                            fontSize: "12px"
                          }} 
                        />
                        <Bar 
                          dataKey="tarefas" 
                          name="Tarefas Atribuídas"
                          fill="var(--primary)" 
                          radius={[6, 6, 0, 0]} 
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className="lg:col-span-2 bg-card border border-border p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 mb-8">
                    <BarChart3 className="text-red-500" size={20} />
                    <h3 className="font-bold text-lg">Distribuição Geral por Prioridade</h3>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart layout="vertical" data={priorityDistribution}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={mode === "dark" ? "#27272a" : "#e2e8f0"} />
                        <XAxis type="number" axisLine={false} tickLine={false} hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "var(--card)", 
                            borderColor: "var(--border)", 
                            borderRadius: "12px",
                            fontSize: "12px"
                          }} 
                        />
                        <Bar dataKey="value" name="Quantidade" radius={[0, 6, 6, 0]}>
                          {priorityDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || "var(--primary)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}
          </div>
      </div>

      {/* Render Project Settings Modal directly to avoid cross-component state leakage */}
      {isSettingsOpen && (
        <ProjectSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          project={project as any}
          initialTab="geral"
        />
      )}
    </div>
  );
}
