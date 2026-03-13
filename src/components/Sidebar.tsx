import { useLiveQuery } from 'dexie-react-hooks';
import { FileText, LayoutDashboard, PenTool, Sidebar as SidebarIcon, Trash2, X } from 'lucide-react';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, closeSidebar, activePageId, setActivePageId } = useStore();
  const pages = useLiveQuery(() => db.pages.orderBy('updatedAt').reverse().toArray());

  const createPage = async (type: Page['type']) => {
    const id = uuidv4();
    const newPage: Page = {
      id,
      title: 'Untitled',
      type,
      content: type === 'document' ? '' : type === 'whiteboard' ? {} : { view: 'table', columns: [], rows: [] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.pages.add(newPage);
    setActivePageId(id);
    if (window.innerWidth < 768) closeSidebar();
  };

  const deletePage = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await db.pages.delete(id);
    if (activePageId === id) {
      setActivePageId(null);
    }
  };

  const getIcon = (type: Page['type']) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'whiteboard': return <PenTool className="w-4 h-4" />;
      case 'database': return <LayoutDashboard className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden transition-opacity" 
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            Workspace
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500"
          >
            <SidebarIcon className="w-4 h-4 hidden md:block" />
            <X className="w-4 h-4 md:hidden" />
          </button>
        </div>

        <div className="p-3 flex-1 overflow-hidden flex flex-col">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Create New
          </div>
          <div className="flex gap-1 mb-4 flex-shrink-0">
            <button
              onClick={() => createPage('document')}
              className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-200 text-gray-600 gap-1"
              title="New Document"
            >
              <FileText className="w-4 h-4" />
              <span className="text-[10px]">Doc</span>
            </button>
            <button
              onClick={() => createPage('whiteboard')}
              className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-200 text-gray-600 gap-1"
              title="New Whiteboard"
            >
              <PenTool className="w-4 h-4" />
              <span className="text-[10px]">Board</span>
            </button>
            <button
              onClick={() => createPage('database')}
              className="flex-1 flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-200 text-gray-600 gap-1"
              title="New Database"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px]">Data</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 flex-shrink-0">
            Pages
          </div>
          <div className="space-y-0.5 overflow-y-auto flex-1 pb-4">
            {pages?.map((page) => (
              <div
                key={page.id}
                onClick={() => {
                  setActivePageId(page.id);
                  if (window.innerWidth < 768) closeSidebar();
                }}
                className={cn(
                  "group flex items-center justify-between px-2 py-2 md:py-1.5 rounded-md cursor-pointer text-sm",
                  activePageId === page.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-200"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {getIcon(page.type)}
                  <span className="truncate">{page.title || 'Untitled'}</span>
                </div>
                <button
                  onClick={(e) => deletePage(e, page.id)}
                  className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded text-gray-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {pages?.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-4">
                No pages yet
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
