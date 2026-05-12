"use client";

import React, { useState } from "react";
import { Sun, Moon, Palette, Check, Settings2 } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { mode, colorTheme, toggleMode, setColorTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const colors = [
    { name: "purple", value: "#7c3aed", label: "Roxo" },
    { name: "blue", value: "#3b82f6", label: "Azul" },
    { name: "green", value: "#10b981", label: "Verde" },
    { name: "rose", value: "#f43f5e", label: "Rosa" },
    { name: "amber", value: "#f59e0b", label: "Laranja" },
  ];

  return (
    <div className="relative">
      <div className="flex p-1 bg-secondary/50 rounded-xl border border-border/50 backdrop-blur-sm">
        <button
          onClick={toggleMode}
          className="p-2 rounded-lg hover:bg-background transition-all text-muted-foreground hover:text-primary shadow-sm"
          title={mode === "light" ? "Mudar para Dark" : "Mudar para Light"}
        >
          {mode === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <div className="w-px h-6 bg-border/50 mx-1 self-center" />

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-2 rounded-lg transition-all text-muted-foreground hover:text-primary flex items-center gap-2",
            isOpen ? "bg-background text-primary" : "hover:bg-background"
          )}
          title="Customizar Cores"
        >
          <Palette size={18} />
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full right-0 mt-2 p-3 bg-card border border-border shadow-2xl rounded-2xl z-50 min-w-[180px] animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tema de Cor</span>
                <Settings2 size={12} className="text-muted-foreground" />
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setColorTheme(color.name as any);
                      // setIsOpen(false);
                    }}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm",
                      colorTheme === color.name ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "opacity-80"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  >
                    {colorTheme === color.name && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-border/50">
                <button
                  onClick={toggleMode}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-all text-sm group"
                >
                  <span className="text-muted-foreground group-hover:text-foreground">Modo {mode === "light" ? "Escuro" : "Claro"}</span>
                  {mode === "light" ? <Moon size={14} /> : <Sun size={14} />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
