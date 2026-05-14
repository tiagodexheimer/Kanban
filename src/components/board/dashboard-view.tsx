"use client";

import React from "react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { useBoardStats } from "@/hooks/use-omnitask";
import { useTheme } from "@/components/providers/theme-provider";
import { 
  TrendingDown, CheckCircle2, Clock, ListTodo, 
  BarChart3, PieChart as PieChartIcon, Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardViewProps {
  boardId: string;
}

export function DashboardView({ boardId }: DashboardViewProps) {
  const { data: stats, isLoading } = useBoardStats(boardId);
  const { mode } = useTheme();

  const COLORS = ["#7c3aed", "#10b981", "#3b82f6", "#f43f5e", "#f59e0b"];
  const PRIORITY_COLORS: Record<string, string> = {
    "Baixa": "#10b981",
    "Média": "#3b82f6",
    "Alta": "#f59e0b",
    "Urgente": "#f43f5e",
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando estatísticas...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
              <ListTodo size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total de Tarefas</p>
              <h4 className="text-3xl font-bold">{stats.summary.total}</h4>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-5 text-primary group-hover:scale-110 transition-transform">
            <ListTodo size={120} />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Concluídas</p>
              <h4 className="text-3xl font-bold">{stats.summary.done}</h4>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-5 text-green-500 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={120} />
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pendentes</p>
              <h4 className="text-3xl font-bold">{stats.summary.pending}</h4>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-5 text-blue-500 group-hover:scale-110 transition-transform">
            <Clock size={120} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Burn-down Chart */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingDown className="text-primary" size={20} />
              <h3 className="font-bold text-lg">Gráfico de Burn-down</h3>
            </div>
            <span className="text-[10px] bg-secondary px-2 py-1 rounded-full text-muted-foreground font-bold uppercase tracking-wider">Últimos 7 dias</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.burnDownData}>
                <defs>
                  <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={mode === "dark" ? "#27272a" : "#e2e8f0"} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--card)", 
                    borderColor: "var(--border)", 
                    borderRadius: "12px",
                    fontSize: "12px"
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                <Area 
                  type="monotone" 
                  dataKey="remaining" 
                  name="Restante"
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRemaining)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="ideal" 
                  name="Ideal"
                  stroke="var(--muted-foreground)" 
                  strokeWidth={2}
                  strokeDasharray="5 5" 
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Productivity Chart */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Activity className="text-green-500" size={20} />
              <h3 className="font-bold text-lg">Produtividade</h3>
            </div>
            <span className="text-[10px] bg-secondary px-2 py-1 rounded-full text-muted-foreground font-bold uppercase tracking-wider">Tarefas Concluídas</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.productivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={mode === "dark" ? "#27272a" : "#e2e8f0"} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--card)", 
                    borderColor: "var(--border)", 
                    borderRadius: "12px",
                    fontSize: "12px"
                  }} 
                />
                <Bar 
                  dataKey="completed" 
                  name="Concluídas"
                  fill="var(--primary)" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <PieChartIcon className="text-blue-500" size={20} />
            <h3 className="font-bold text-lg">Distribuição por Status</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                >
                  {stats.statusDistribution.map((entry, index) => (
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

        {/* Priority Distribution */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="text-amber-500" size={20} />
            <h3 className="font-bold text-lg">Tarefas por Prioridade</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.priorityDistribution}>
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
                  {stats.priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || "var(--primary)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
