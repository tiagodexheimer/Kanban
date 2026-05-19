import React from "react";
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { useBoardReports } from "@/hooks/use-time-tracking";
import { 
  Users, CheckCircle2, Clock, AlertTriangle, 
  FileSpreadsheet, Printer, Activity, TrendingUp, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WorkloadViewProps {
  boardId: string;
}

export function WorkloadView({ boardId }: WorkloadViewProps) {
  const { data: reportsData, isLoading } = useBoardReports(boardId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando dados de carga de trabalho...</p>
      </div>
    );
  }

  if (!reportsData) return null;

  const { cards, members, summary } = reportsData;

  const totalHours = Math.round(summary.totalTimeLogged / 3600);
  const totalMinutes = Math.round((summary.totalTimeLogged % 3600) / 60);

  // Format seconds to string: "2h 45m"
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Recharts colors
  const CHART_COLORS = ["#7c3aed", "#10b981", "#3b82f6", "#ec4899", "#f59e0b", "#64748b"];

  // 1. Data for tasks distribution bar chart (completed vs pending per user)
  const taskDistributionData = members.map(m => ({
    name: m.name,
    "Concluídas": m.completedTasksCount,
    "Pendentes": m.pendingTasksCount,
  }));

  // 2. Data for time spent pie chart (hours per user)
  const timeSpentData = members
    .filter(m => m.totalTimeLogged > 0)
    .map(m => ({
      name: m.name,
      value: Math.round(m.totalTimeLogged / 60), // in minutes
    }));

  const overloadedMembers = members.filter(m => m.workloadStatus === "RED");

  // Client-side CSV Export
  const handleExportCSV = () => {
    try {
      const headers = ["Título", "Lista", "Prioridade", "Prazo", "Criado Em", "Responsáveis", "Tempo Total (minutos)", "Status"];
      const rows = cards.map(c => [
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.columnTitle.replace(/"/g, '""')}"`,
        `"${c.priority}"`,
        c.dueDate ? new Date(c.dueDate).toLocaleDateString("pt-BR") : "Sem data",
        new Date(c.createdAt).toLocaleDateString("pt-BR"),
        `"${c.assignees.map(a => a.name || a.id).join(", ")}"`,
        Math.round(c.totalDuration / 60),
        c.isCompleted ? "Concluído" : "Pendente"
      ]);

      const csvContent = "\ufeff" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio-sprint-${boardId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar CSV");
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500 print:bg-white print:p-8 print:text-black">
      {/* Header Panel (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="text-primary" />
            Carga de Trabalho & Recursos
          </h2>
          <p className="text-sm text-muted-foreground">Distribuição de tarefas, horas registradas e alertas de sobrecarga dos membros.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl text-sm font-bold transition-all border border-border cursor-pointer shadow-sm"
          >
            <FileSpreadsheet size={16} />
            Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-md shadow-primary/20"
          >
            <Printer size={16} />
            Imprimir Relatório (PDF)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Time card */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Tempo Total Logado</span>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`}
              </span>
            </div>
          </div>
        </div>

        {/* Average Time per Task */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Média por Tarefa</span>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {summary.averageTimePerTask > 0 ? formatDuration(summary.averageTimePerTask) : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Métricas Gerais</span>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {summary.completedTasks} / {summary.totalTasks} concluintes
              </span>
            </div>
          </div>
        </div>

        {/* Running Timers count */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 shrink-0">
              <Activity size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Monitor de Foco</span>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {cards.filter(c => c.hasActiveTimer).length} timers ativos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overload Alert Notification */}
      {overloadedMembers.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 print:border-rose-500">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-rose-600 print:text-rose-700">Risco de Sobrecarga Detectado!</h4>
            <p className="text-xs text-rose-600/80 mt-0.5 print:text-rose-700/90 leading-relaxed">
              Os seguintes membros possuem mais de 5 tarefas em andamento. Considere redistribuir as pendências para evitar burnout:{" "}
              <span className="font-bold">{overloadedMembers.map(m => m.name).join(", ")}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:space-y-8">
        {/* Left Side: Tasks Distribution Bar Chart */}
        <div className="lg:col-span-7 bg-card border border-border p-6 rounded-2xl shadow-sm print:border-none print:shadow-none">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">Distribuição de Carga de Trabalho</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskDistributionData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "12px" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Concluídas" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={24} />
                <Bar dataKey="Pendentes" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Time Spent Pie Chart */}
        <div className="lg:col-span-5 bg-card border border-border p-6 rounded-2xl shadow-sm print:border-none print:shadow-none">
          <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">Horas Investidas por Membro</h3>
          {timeSpentData.length > 0 ? (
            <div className="h-80 w-full relative flex flex-col items-center justify-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={timeSpentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {timeSpentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${Math.round(Number(value) / 60)}h`, "Tempo"]}
                      contentStyle={{ backgroundColor: "var(--background)", borderColor: "var(--border)", borderRadius: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 max-h-16 overflow-y-auto px-4 w-full text-xs">
                {timeSpentData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground truncate max-w-[80px]" title={entry.name}>{entry.name}</span>
                    <span className="font-bold text-foreground">{Math.round(entry.value / 60)}h</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80 w-full flex flex-col items-center justify-center text-muted-foreground italic text-xs">
              <Clock size={36} className="text-muted-foreground/30 mb-3" />
              Nenhum tempo logado neste quadro ainda.
            </div>
          )}
        </div>
      </div>

      {/* Member Resource Workload Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-muted-foreground">Status Individual de Recursos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2">
          {members.map(member => {
            const hasOverload = member.workloadStatus === "RED";
            const percent = member.totalTasks > 0 
              ? Math.round((member.completedTasksCount / member.totalTasks) * 100)
              : 0;

            return (
              <div 
                key={member.id} 
                className={cn(
                  "bg-card border p-5 rounded-2xl space-y-4 shadow-sm transition-all border-border",
                  hasOverload && "border-rose-500/30 hover:border-rose-500/50"
                )}
              >
                {/* Member Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full border border-border bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>
                          {member.name
                            .split(" ")
                            .map(n => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground truncate block text-sm">{member.name}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">Membro da Equipe</span>
                    </div>
                  </div>
                  {hasOverload && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500 text-white animate-pulse">
                      Sobrecarga
                    </span>
                  )}
                </div>

                {/* Progress Bar showing completion progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground text-[10px] uppercase">Progresso de Entregas</span>
                    <span className="text-foreground">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Stats grids */}
                <div className="grid grid-cols-3 gap-2.5 text-center border-t border-border/50 pt-3">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Concluídas</span>
                    <span className="text-sm font-black text-emerald-500">{member.completedTasksCount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Pendentes</span>
                    <span className="text-sm font-black text-blue-500">{member.pendingTasksCount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">Tempo Total</span>
                    <span className="text-sm font-black text-primary">{formatDuration(member.totalTimeLogged)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Print PDF Custom Stylesheet */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          nav, aside, header, footer, button, .print-hide {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .recharts-legend-wrapper, .recharts-tooltip-wrapper {
            display: none !important;
          }
          .bg-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
