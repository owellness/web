"use client";

import type { JSONContent } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";

import type { TiptapDocument } from "@/application/articles/model";
import { uploadImage } from "@/presentation/lib/uploadImage";

const EMPTY_DOC: TiptapDocument = { type: "doc", content: [] };

const ToolbarButton = ({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`rounded-md px-2.5 py-1 text-sm transition disabled:opacity-50 ${
      active
        ? "bg-foreground text-background"
        : "text-foreground hover:bg-muted"
    }`}
  >
    {children}
  </button>
);

const insertQAPattern = (editor: Editor) => {
  editor
    .chain()
    .focus()
    .insertContent([
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "질문을 입력하세요?" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "답변을 한두 문장으로 작성하세요." }],
      },
    ])
    .run();
};

const toggleLink = (editor: Editor) => {
  const prev = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("링크 URL", prev ?? "https://");
  if (url === null) return;
  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url, target: "_blank", rel: "noopener noreferrer" })
    .run();
};

function Toolbar({
  editor,
  onPickImage,
  uploading,
}: {
  editor: Editor;
  onPickImage: () => void;
  uploading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-3 py-2">
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton onClick={() => insertQAPattern(editor)}>
        ? Q&amp;A
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        굵게
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        기울임
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        취소선
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("link")}
        onClick={() => toggleLink(editor)}
      >
        🔗 링크
      </ToolbarButton>
      <ToolbarButton disabled={uploading} onClick={onPickImage}>
        {uploading ? "업로드 중…" : "🖼 이미지"}
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • 목록
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. 번호
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        인용
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        코드
      </ToolbarButton>
    </div>
  );
}

export function TiptapEditor({
  initialValue,
  onChange,
}: {
  initialValue: TiptapDocument;
  onChange: (json: TiptapDocument) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, HTMLAttributes: { loading: "lazy" } }),
    ],
    content: (initialValue ?? EMPTY_DOC) as JSONContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-tiptap min-h-[280px] max-w-none px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TiptapDocument);
    },
  });

  useEffect(() => () => editor?.destroy(), [editor]);

  const handleFiles = async (files: FileList | null) => {
    if (!editor || !files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { url } = await uploadImage(file);
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      }
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!editor) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        에디터를 불러오는 중…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Toolbar
        editor={editor}
        uploading={uploading}
        onPickImage={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploadError ? (
        <p className="border-b border-border bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {uploadError}
        </p>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
