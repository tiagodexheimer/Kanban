"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Star,
  Search,
  LogOut,
  User as UserIcon,
  Plus,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Book,
  Palette
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useBoards, useCreateBoard, useProjects, useCreateProject, useInviteToProject, useCreateFolder } from "@/hooks/use-omnitask";
import { useViewStore } from "@/store/use-view-store";
import { toast } from "sonner";
import { Folder, ChevronDown, Users, UserPlus, FolderPlus } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { ProjectSettingsModal } from "../project/project-settings-modal";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const { data: boards, isLoading: isLoadingBoards } = useBoards();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const createBoardMutation = useCreateBoard();
  const createProjectMutation = useCreateProject();
  const createFolderMutation = useCreateFolder();
  const inviteMutation = useInviteToProject();
  const { activeBoardId, setActiveBoardId } = useViewStore();
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectsSectionExpanded, setIsProjectsSectionExpanded] = useState(true);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
  };

  React.useEffect(() => {
    if (!activeBoardId || !projects) return;

    for (const project of projects) {
      // Check direct boards of the project
      const hasDirectBoard = project.boards?.some(b => b.id === activeBoardId);
      if (hasDirectBoard) {
        setExpandedProjects(prev => prev.includes(project.id) ? prev : [...prev, project.id]);
        setIsProjectsSectionExpanded(true);
        break;
      }

      // Check boards inside folders of the project
      if (project.folders) {
        let foundInFolder = false;
        for (const folder of project.folders) {
          const hasBoardInFolder = folder.boards?.some(b => b.id === activeBoardId);
          if (hasBoardInFolder) {
            setExpandedProjects(prev => prev.includes(project.id) ? prev : [...prev, project.id]);
            setExpandedFolders(prev => prev.includes(folder.id) ? prev : [...prev, folder.id]);
            setIsProjectsSectionExpanded(true);
            foundInFolder = true;
            break;
          }
        }
        if (foundInFolder) break;
      }
    }
  }, [activeBoardId, projects]);

  const router = useRouter();
  const pathname = usePathname();

  const topNavItems: { icon: any; label: string; path?: string }[] = [
    { icon: Star, label: "Favoritos" },
    { icon: Search, label: "Busca" },
  ];

  const bottomNavItems = [
    { icon: Book, label: "Documentos", path: `/docs` },
    { icon: Palette, label: "Whiteboards", path: activeBoardId ? `/boards/${activeBoardId}/whiteboard` : `/whiteboards` },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  const handleNavClick = (item: any) => {
    if (item.path) {
      router.push(item.path);
    }
  };

  const handleBoardClick = (boardId: string) => {
    router.push(`/boards/${boardId}`);
  };


  const handleCreateBoard = async (projectId?: string, folderId?: string) => {
    const title = prompt("Título do novo quadro:");
    if (!title) return;

    createBoardMutation.mutate({ 
      title, 
      description: "Novo quadro criado",
      projectId,
      folderId
    }, {
      onSuccess: (data) => {
        router.push(`/boards/${data.id}`);
      }
    });
  };

  const handleCreateFolder = async (projectId: string) => {
    const title = prompt("Título da nova pasta:");
    if (!title) return;

    createFolderMutation.mutate({ 
      title, 
      projectId 
    });
  };

  const handleCreateProject = async () => {
    const title = prompt("Título do novo projeto:");
    if (!title) return;

    createProjectMutation.mutate({ 
      title, 
      description: "Novo projeto" 
    });
  };

  const currentProject = projects?.find(p => p.id === selectedProjectId);

  const handleInvite = async (projectId: string) => {
    const email = prompt("E-mail do usuário para convidar:");
    if (!email) return;
    inviteMutation.mutate({ projectId, email });
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-card border-r border-border transition-all duration-300 flex flex-col sticky top-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!isCollapsed && <span className="font-bold text-xl bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">OmniTask</span>}
        <div className="flex items-center gap-1">
          {!isCollapsed && <ThemeToggle />}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6 px-3">
        <div className="space-y-1">
          {topNavItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavClick(item)}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-foreground",
                item.path && pathname.startsWith(item.path) && item.path !== "/" ? "bg-primary/10 text-primary font-bold" : ""
              )}
            >
              <item.icon size={20} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}

          {/* Unified "Projetos" section */}
          <div className="space-y-1">
            <div 
              onClick={() => {
                if (isCollapsed) {
                  router.push(activeBoardId ? `/boards/${activeBoardId}` : `/`);
                } else {
                  setIsProjectsSectionExpanded(!isProjectsSectionExpanded);
                }
              }}
              className={cn(
                "group w-full flex items-center justify-between p-2 rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer",
                pathname === "/" || (pathname.startsWith("/boards") && !pathname.includes("/whiteboard")) ? "bg-primary/10 text-primary font-bold" : ""
              )}
            >
              <div className="flex items-center gap-3">
                <FolderKanban size={20} className={cn(pathname === "/" || (pathname.startsWith("/boards") && !pathname.includes("/whiteboard")) ? "text-primary" : "text-muted-foreground")} />
                {!isCollapsed && <span className="font-medium">Projetos</span>}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCreateProject(); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-primary/20 rounded text-muted-foreground hover:text-foreground transition-all"
                    title="Novo projeto"
                  >
                    <Plus size={14} />
                  </button>
                  <ChevronDown 
                    size={16} 
                    className={cn("transition-transform text-muted-foreground", isProjectsSectionExpanded ? "rotate-180" : "")} 
                  />
                </div>
              )}
            </div>

            {/* Nested Project List */}
            {isProjectsSectionExpanded && !isCollapsed && (
              <div className="ml-4 pl-2 border-l border-border space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                {isLoadingProjects ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground animate-pulse">Carregando projetos...</div>
                ) : (
                  projects?.map((project) => (
                    <div key={project.id} className="space-y-1">
                      <div 
                        className={cn(
                          "group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-all",
                          expandedProjects.includes(project.id) ? "bg-accent/50" : ""
                        )}
                        onClick={() => toggleProject(project.id)}
                      >
                        <Folder size={18} className="text-primary shrink-0" />
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="font-semibold text-sm truncate">{project.title}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedProjectId(project.id); }}
                              className="p-1 hover:bg-primary/20 rounded text-primary"
                              title="Configurações do projeto"
                            >
                              <Settings size={12} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleInvite(project.id); }}
                              className="p-1 hover:bg-primary/20 rounded text-primary"
                              title="Convidar membro"
                            >
                              <UserPlus size={12} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCreateFolder(project.id); }}
                              className="p-1 hover:bg-primary/20 rounded text-primary"
                              title="Nova pasta"
                            >
                              <FolderPlus size={12} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCreateBoard(project.id); }}
                              className="p-1 hover:bg-primary/20 rounded text-primary"
                              title="Novo quadro"
                            >
                              <Plus size={12} />
                            </button>
                            <ChevronDown size={14} className={cn("transition-transform", expandedProjects.includes(project.id) ? "rotate-180" : "")} />
                          </div>
                        </div>
                      </div>

                      {expandedProjects.includes(project.id) && (
                        <div className="ml-4 pl-2 border-l border-border space-y-1 mt-1 animate-in slide-in-from-top-1 duration-200">
                          {/* Folders in Project */}
                          {project.folders?.map((folder) => (
                            <div key={folder.id} className="space-y-1">
                              <div 
                                className={cn(
                                  "group flex items-center gap-2 p-1.5 rounded-lg cursor-pointer hover:bg-accent transition-all",
                                  expandedFolders.includes(folder.id) ? "bg-accent/30" : ""
                                )}
                                onClick={() => toggleFolder(folder.id)}
                              >
                                <Folder size={16} className="text-muted-foreground shrink-0" />
                                <span className="flex-1 text-xs font-medium truncate">{folder.title}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleCreateBoard(project.id, folder.id); }}
                                    className="p-0.5 hover:bg-primary/20 rounded text-primary"
                                  >
                                    <Plus size={10} />
                                  </button>
                                  <ChevronDown size={12} className={cn("transition-transform", expandedFolders.includes(folder.id) ? "rotate-180" : "")} />
                                </div>
                              </div>
                              
                              {expandedFolders.includes(folder.id) && (
                                <div className="ml-4 pl-2 border-l border-border/50 space-y-1">
                                  {folder.boards?.map((board) => (
                                    <button
                                      key={board.id}
                                      onClick={() => handleBoardClick(board.id)}
                                      className={cn(
                                        "w-full flex items-center gap-3 p-1.5 rounded-lg text-[13px] transition-all",
                                        activeBoardId === board.id 
                                          ? "bg-primary/10 text-primary font-medium" 
                                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                      )}
                                    >
                                      <LayoutDashboard size={12} />
                                      <span className="truncate">{board.title}</span>
                                    </button>
                                  ))}
                                  {(folder.boards?.length || 0) === 0 && (
                                    <div className="px-2 py-1 text-[10px] text-muted-foreground italic">Vazio</div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Direct Boards in Project */}
                          {project.boards?.filter(b => !b.folderId).map((board) => (
                            <button
                              key={board.id}
                              onClick={() => handleBoardClick(board.id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-1.5 rounded-lg text-[13px] transition-all",
                                activeBoardId === board.id 
                                  ? "bg-primary/10 text-primary font-medium" 
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                            >
                              <LayoutDashboard size={12} />
                              <span className="truncate">{board.title}</span>
                            </button>
                          ))}
                          {(project.boards?.length || 0) === 0 && (project.folders?.length || 0) === 0 && (
                            <div className="px-2 py-1 text-[10px] text-muted-foreground italic">Nenhum quadro</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Bottom Nav Items */}
          {bottomNavItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavClick(item)}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-foreground",
                item.path && pathname.startsWith(item.path) && item.path !== "/" ? "bg-primary/10 text-primary font-bold" : ""
              )}
            >
              <item.icon size={20} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {!isCollapsed && (
            <div className="px-2 flex items-center justify-between group">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quadros</span>
              <button 
                onClick={() => handleCreateBoard()}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-accent rounded transition-all"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
          
          <div className="space-y-1">
            {isLoadingBoards ? (
              <div className="px-2 py-1 text-xs text-muted-foreground animate-pulse">Carregando...</div>
            ) : (
              boards?.filter(b => !b.projectId).map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleBoardClick(board.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all",
                    activeBoardId === board.id || (!activeBoardId && boards.filter(b => !b.projectId)[0]?.id === board.id)
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <LayoutDashboard size={18} />
                  {!isCollapsed && <span className="font-medium truncate">{board.title}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border space-y-4">
        {session?.user && (
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-accent/30 overflow-hidden transition-all",
            isCollapsed ? "justify-center" : ""
          )}>
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full rounded-lg object-cover" />
              ) : (
                <span className="text-xs font-bold">
                  {session.user.name
                    ? session.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()
                    : "??"}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-foreground">{session.user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
              </div>
            )}
          </div>
        )}

        {session ? (
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className={cn(
              "w-full flex items-center gap-3 p-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-semibold">Sair</span>}
          </button>
        ) : (
          <Link 
            href="/auth/signin"
            className={cn(
              "w-full flex items-center gap-3 p-2.5 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <UserIcon size={20} />
            {!isCollapsed && <span className="font-semibold">Entrar</span>}
          </Link>
        )}

        <button 
          onClick={() => handleCreateBoard()}
          className={cn(
            "w-full flex items-center gap-3 bg-primary p-2.5 rounded-xl text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95",
            isCollapsed ? "justify-center px-0" : ""
          )}
        >
          <Plus size={20} />
          {!isCollapsed && <span className="font-semibold">Novo Board</span>}
        </button>
      </div>
      {currentProject && (
        <ProjectSettingsModal 
          isOpen={!!selectedProjectId} 
          onClose={() => setSelectedProjectId(null)} 
          project={currentProject}
        />
      )}
    </aside>
  );
}
