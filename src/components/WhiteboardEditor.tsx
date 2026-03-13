import { Tldraw, useEditor } from 'tldraw';
import 'tldraw/tldraw.css';
import { useEffect, useState } from 'react';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

export function WhiteboardEditor({ page }: { page: Page }) {
  const [title, setTitle] = useState(page.title);
  const { sidebarOpen, toggleSidebar } = useStore();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    db.pages.update(page.id, { title: newTitle, updatedAt: Date.now() });
  };

  useEffect(() => {
    setTitle(page.title);
  }, [page.id]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      <div className="flex-shrink-0 px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 bg-white flex items-center justify-between z-10">
        <div className="flex items-center gap-2 md:gap-4 w-full">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Whiteboard"
            className="text-lg md:text-xl font-semibold border-none outline-none placeholder-gray-300 text-gray-800 bg-transparent flex-1 min-w-0"
          />
          <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap">
            Saved locally
          </span>
        </div>
      </div>
      <div className="flex-1 relative">
        <Tldraw
          persistenceKey={`tldraw-${page.id}`}
        />
      </div>
    </div>
  );
}
