"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { 
  Bold, Italic, List, ListOrdered, 
  Heading1, Heading2, Quote, Code,
  Undo, Redo, Link as LinkIcon, 
  Image as ImageIcon, CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Comece a escrever...", className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image,
      Highlight,
      Typography,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none max-w-full min-h-[300px] text-foreground",
      },
    },
  });

  // Update content when it changes from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const MenuButton = ({ onClick, isActive, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-all hover:bg-accent",
        isActive ? "bg-primary/20 text-primary" : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("border border-border rounded-xl bg-card overflow-hidden transition-all focus-within:border-primary/50 shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/20">
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          isActive={editor.isActive("bold")}
          title="Negrito (Ctrl+B)"
        >
          <Bold size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          isActive={editor.isActive("italic")}
          title="Itálico (Ctrl+I)"
        >
          <Italic size={18} />
        </MenuButton>
        <div className="w-px h-4 bg-border mx-1" />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          isActive={editor.isActive("heading", { level: 1 })}
          title="Título 1"
        >
          <Heading1 size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor.isActive("heading", { level: 2 })}
          title="Título 2"
        >
          <Heading2 size={18} />
        </MenuButton>
        <div className="w-px h-4 bg-border mx-1" />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          isActive={editor.isActive("bulletList")}
          title="Lista"
        >
          <List size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          isActive={editor.isActive("orderedList")}
          title="Lista Numerada"
        >
          <ListOrdered size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleTaskList().run()} 
          isActive={editor.isActive("taskList")}
          title="Tarefas"
        >
          <CheckSquare size={18} />
        </MenuButton>
        <div className="w-px h-4 bg-border mx-1" />
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          isActive={editor.isActive("blockquote")}
          title="Citação"
        >
          <Quote size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
          isActive={editor.isActive("codeBlock")}
          title="Bloco de Código"
        >
          <Code size={18} />
        </MenuButton>
        <div className="flex-1" />
        <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo size={18} />
        </MenuButton>
      </div>

      <div className="p-4 sm:p-8 min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      <div className="px-4 py-2 border-t border-border bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
        <span>Pronto para documentar</span>
        <div className="flex items-center gap-4">
          <span>Markdown suportado</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Sincronizado
          </span>
        </div>
      </div>
    </div>
  );
}
