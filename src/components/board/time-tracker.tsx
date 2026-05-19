import React, { useState, useEffect } from "react";
import { Play, Pause, Clock, Plus, Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { 
  useCardTime, 
  useStartTimer, 
  useStopTimer, 
  useLogTime, 
  useDeleteTimeLog 
} from "@/hooks/use-time-tracking";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface TimeTrackerProps {
  cardId: string;
}

export function TimeTracker({ cardId }: TimeTrackerProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const { data: timeData, isLoading } = useCardTime(cardId);
  const startTimer = useStartTimer(cardId);
  const stopTimer = useStopTimer(cardId);
  const logTime = useLogTime(cardId);
  const deleteTimeLog = useDeleteTimeLog(cardId);

  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isManualExpanded, setIsManualExpanded] = useState(false);
  
  // Manual log state
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");

  // Ticking state for active timer
  const [tickingSeconds, setTickingSeconds] = useState(0);

  useEffect(() => {
    let intervalId: any;

    if (timeData?.activeTimer) {
      const startTime = new Date(timeData.activeTimer.startTime).getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const elapsed = Math.max(0, Math.round((now - startTime) / 1000));
        setTickingSeconds(elapsed);
      };

      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else {
      setTickingSeconds(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timeData?.activeTimer]);

  if (isLoading) {
    return (
      <div className="p-3 text-center text-xs text-muted-foreground animate-pulse">
        Carregando registros de tempo...
      </div>
    );
  }

  const activeTimer = timeData?.activeTimer;
  const totalDuration = timeData?.totalDuration || 0;
  const logs = timeData?.logs || [];

  // Format seconds to string: "2h 45m" or "15m 30s"
  const formatDuration = (totalSeconds: number, includeSeconds = false) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    if (includeSeconds || (hrs === 0 && mins === 0)) parts.push(`${secs}s`);

    return parts.join(" ");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalSecs = (h * 3600) + (m * 60);

    if (totalSecs <= 0) return;

    logTime.mutate({
      duration: totalSecs,
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        setHours("");
        setMinutes("");
        setNotes("");
        setIsManualExpanded(false);
      }
    });
  };

  return (
    <div className="bg-card border border-border/60 rounded-xl p-3.5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
          <Clock size={12} className="text-primary" />
          Registro de Tempo
        </span>
        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          Total: {formatDuration(totalDuration + tickingSeconds)}
        </span>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-3 bg-secondary/30 p-2.5 rounded-xl border border-border/30">
        {activeTimer ? (
          <>
            <button
              type="button"
              onClick={() => stopTimer.mutate()}
              className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Pausar cronômetro"
            >
              <Pause size={18} fill="white" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-foreground">Cronômetro ativo</span>
              </div>
              <span className="text-lg font-black text-emerald-500 font-mono tracking-wider tabular-nums">
                {formatDuration(tickingSeconds, true)}
              </span>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => startTimer.mutate()}
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Iniciar cronômetro"
            >
              <Play size={18} fill="white" className="ml-0.5" />
            </button>
            <div className="flex-1">
              <span className="text-xs text-muted-foreground block font-bold">Cronômetro pausado</span>
              <span className="text-sm font-bold text-foreground">Iniciar registro ao vivo</span>
            </div>
          </>
        )}
      </div>

      {/* Manual Time Logging */}
      <div className="border-t border-border/30 pt-3">
        <button
          type="button"
          onClick={() => setIsManualExpanded(!isManualExpanded)}
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground font-bold transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Plus size={14} className={cn("transition-transform", isManualExpanded && "rotate-45")} />
            Registrar tempo manualmente
          </span>
        </button>

        {isManualExpanded && (
          <form onSubmit={handleManualSubmit} className="mt-3 space-y-3 p-3 bg-secondary/20 rounded-xl border border-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Horas</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-card border border-border/50 rounded-lg p-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Minutos</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full bg-card border border-border/50 rounded-lg p-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-muted-foreground uppercase mb-1">Observações</label>
              <textarea
                placeholder="No que você trabalhou?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-card border border-border/50 rounded-lg p-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={logTime.isPending}
              className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              Confirmar Registro
            </button>
          </form>
        )}
      </div>

      {/* History Log Entries */}
      {logs.length > 0 && (
        <div className="border-t border-border/30 pt-3">
          <button
            type="button"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground font-bold transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileText size={14} />
              Histórico de registros ({logs.length})
            </span>
            {isHistoryExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isHistoryExpanded && (
            <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar animate-in fade-in duration-300">
              {logs.map((log) => {
                const duration = log.duration || 0;
                const formattedDate = new Date(log.startTime).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                });
                const isMyLog = log.userId === currentUserId;

                return (
                  <div key={log.id} className="flex items-start justify-between gap-2 p-2 bg-secondary/10 hover:bg-secondary/20 border border-border/20 rounded-lg transition-colors group">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full border border-border bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0 overflow-hidden" title={log.user.name || ""}>
                        {log.user.image ? (
                          <img src={log.user.image} alt={log.user.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <span>
                            {(log.user.name || "??")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px]">
                        <div className="font-bold text-foreground">
                          {log.user.name || log.user.email}
                        </div>
                        <div className="text-muted-foreground text-[10px] flex items-center gap-2">
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span className="font-bold text-primary">{formatDuration(duration)}</span>
                        </div>
                        {log.notes && (
                          <p className="text-muted-foreground mt-1 bg-secondary/30 p-1.5 rounded-md italic border border-border/10 leading-relaxed text-[10px]">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {isMyLog && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Deseja excluir este registro de tempo?")) {
                            deleteTimeLog.mutate(log.id);
                          }
                        }}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                        title="Excluir registro"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
