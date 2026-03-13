import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

export function DocumentEditor({ page }: { page: Page }) {
  const [title, setTitle] = useState(page.title);
  const { toggleSidebar, sidebarOpen } = useStore();

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
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-12">
        <div className="mb-6 md:mb-8">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Document"
            className="text-3xl md:text-4xl font-bold w-full border-none outline-none placeholder-gray-300 text-gray-900 bg-transparent"
          />
          <div className="text-xs md:text-sm text-gray-400 mt-2">
            Last edited on {format(page.updatedAt, 'MMM d, yyyy h:mm a')}
          </div>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
