import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { getPageIconComponent } from '../lib/pageIcons';

export function DocumentEditor({ page }: { page: Page }) {
  const [title, setTitle] = useState(page.title);
  const { toggleSidebar, sidebarOpen } = useStore();
  const PageIcon = getPageIconComponent(page);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Press "/" for commands, or start typing...',
      }),
    ],
    content: page.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      db.pages.update(page.id, { content: html, updatedAt: Date.now() });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-1',
      },
    },
  });

  useEffect(() => {
    if (editor && page.content !== editor.getHTML()) {
      editor.commands.setContent(page.content || '');
    }
    setTitle(page.title);
  }, [page.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    db.pages.update(page.id, { title: newTitle, updatedAt: Date.now() });
  };

  return (
    <div className="glass-panel-strong fade-slide-up h-full overflow-y-auto rounded-[32px] bg-white/70">
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-12">
        <div className="mb-8 border-b border-slate-200/70 pb-8 md:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50/80 px-3 py-1.5 text-sm font-medium text-cyan-800">
            <PageIcon className="h-4 w-4" />
            <span>Presentation Document</span>
          </div>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Document"
            className="w-full border-none bg-transparent font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300 text-4xl md:text-6xl"
          />
          <div className="mt-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-400 md:text-sm">
            Last edited on {format(page.updatedAt, 'MMM d, yyyy h:mm a')}
          </div>
        </div>
        <div className="glass-panel rounded-[28px] px-6 py-4 md:px-8 md:py-6">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
