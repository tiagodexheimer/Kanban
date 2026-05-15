"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useUpdateProfile } from "@/hooks/use-omnitask";
import { 
  User, Mail, Lock, Shield, 
  Save, AlertCircle, CheckCircle2,
  Settings as SettingsIcon,
  Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const { data: session, update } = useSession();
  const updateProfileMutation = useUpdateProfile();
  
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      await updateProfileMutation.mutateAsync({ name, email });
      // Update local session
      await update({ name, email });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    if (password !== confirmPassword) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfileMutation.mutateAsync({ password });
      setPassword("");
      setConfirmPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-primary">
          <SettingsIcon size={32} strokeWidth={2.5} />
          <h1 className="text-4xl font-black tracking-tight">Configurações</h1>
        </div>
        <p className="text-muted-foreground text-lg">Gerencie seu perfil e preferências de segurança.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <section className="space-y-6 bg-card/50 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <User size={120} />
          </div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold">Perfil Pessoal</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Endereço de E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || (name === session?.user?.name && email === session?.user?.email)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-primary/20"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </form>
        </section>

        {/* Security Section */}
        <section className="space-y-6 bg-card/50 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield size={120} />
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Lock size={20} />
            </div>
            <h2 className="text-xl font-bold">Segurança</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border/50 rounded-xl py-3 pl-10 pr-12 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Min. 8 caracteres"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nova Senha</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full bg-background/50 border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all",
                    password && confirmPassword && password !== confirmPassword && "border-destructive focus:ring-destructive"
                  )}
                  placeholder="Repita a nova senha"
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-destructive font-bold flex items-center gap-1 mt-1 ml-1">
                  <AlertCircle size={10} /> As senhas não conferem
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !password || password !== confirmPassword}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-foreground text-background rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              <Shield size={18} />
              Atualizar Senha
            </button>
          </form>
        </section>
      </div>

      {/* Footer Info */}
      <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl flex items-start gap-4">
        <CheckCircle2 className="text-primary mt-1 shrink-0" size={20} />
        <div className="space-y-1">
          <h4 className="font-bold text-primary">Sua privacidade é nossa prioridade</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Todas as alterações são sincronizadas imediatamente com sua conta OmniTask. 
            Suas senhas são criptografadas com hashing de nível militar (Bcrypt) antes de serem armazenadas.
          </p>
        </div>
      </div>
    </div>
  );
}
