import { useLiveQuery } from 'dexie-react-hooks';
import {
  Bot,
  FileText,
  Grip,
  LayoutDashboard,
  PenTool,
  Sidebar as SidebarIcon,
  Trash2,
  X,
} from 'lucide-react';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { getPageIconComponent, suggestPageIcon } from '../lib/pageIcons';

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
      icon: suggestPageIcon('Untitled', type),
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
        "glass-panel fixed inset-y-0 left-0 z-50 m-3 mr-0 w-72 rounded-[28px] flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"
      )}>
        <div className="p-5 flex items-center justify-between border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.84))]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-[radial-gradient(circle_at_top,#22d3ee,#0f172a_72%)] text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
              <Bot className="h-4 w-4" strokeWidth={2} />
              <Grip className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-cyan-300 p-0.5 text-slate-950" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-tight text-slate-900">openClaw</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">System Workspace</div>
            </div>
          </div>
          <button onClick={toggleSidebar} className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-900">
            <SidebarIcon className="w-4 h-4 hidden md:block" />
            <X className="w-4 h-4 md:hidden" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="section-title mb-3 px-2">
            Create New
          </div>
          <div className="mb-5 grid grid-cols-3 gap-2 flex-shrink-0">
            <button
              onClick={() => createPage('document')}
              className="glass-panel-strong flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-950"
              title="New Document"
            >
              <FileText className="w-4 h-4" />
              <span className="text-[10px]">Doc</span>
            </button>
            <button
              onClick={() => createPage('whiteboard')}
              className="glass-panel-strong flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-950"
              title="New Whiteboard"
            >
              <PenTool className="w-4 h-4" />
              <span className="text-[10px]">Board</span>
            </button>
            <button
              onClick={() => createPage('database')}
              className="glass-panel-strong flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-950"
              title="New Database"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px]">Data</span>
            </button>
          </div>

          <div className="section-title mb-3 px-2 flex-shrink-0">
            Pages
          </div>
          <div className="space-y-1 overflow-y-auto flex-1 pb-4">
            {pages?.map((page) => (
              <div
                key={page.id}
                onClick={() => {
                  setActivePageId(page.id);
                  if (window.innerWidth < 768) closeSidebar();
                }}
                className={cn(
                  "group flex items-center justify-between rounded-2xl px-3 py-2.5 cursor-pointer text-sm transition-all duration-300",
                  activePageId === page.id
                    ? "bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]"
                    : "text-slate-600 hover:bg-white/75 hover:text-slate-950"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {(() => {
                    const Icon = getPageIconComponent(page);
                    return <Icon className="w-4 h-4" />;
                  })()}
                  <span className="truncate">{page.title || 'Untitled'}</span>
                </div>
                <button
                  onClick={(e) => deletePage(e, page.id)}
                  className="rounded-lg p-1 text-inherit opacity-100 transition-all md:opacity-0 group-hover:opacity-100 hover:bg-black/10"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {pages?.length === 0 && (
              <div className="glass-panel-strong py-6 px-4 text-center text-sm text-slate-400 rounded-2xl">
                No pages yet
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
