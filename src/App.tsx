import { Sidebar } from './components/Sidebar';
import { DocumentEditor } from './components/DocumentEditor';
import { WhiteboardEditor } from './components/WhiteboardEditor';
import { DatabaseEditor } from './components/DatabaseEditor';
import { AIAssistant } from './components/AIAssistant';
import { useStore } from './store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { FileText, FolderPlus, Menu, Presentation, Sidebar as SidebarIcon, Sparkles } from 'lucide-react';
import { suggestPageIcon } from './lib/pageIcons';

export default function App() {
  const { activePageId, setActivePageId, sidebarOpen, toggleSidebar } = useStore();
  const activePage = useLiveQuery(
    () => activePageId ? db.pages.get(activePageId) : undefined,
    [activePageId]
  );

  return (
    <div className="app-shell flex h-[100dvh] w-full overflow-hidden text-slate-900">
      <div className="floating-orb left-[-80px] top-[-60px] h-56 w-56 bg-cyan-200/40" />
      <div className="floating-orb bottom-[-120px] right-[-40px] h-72 w-72 bg-sky-200/30" style={{ animationDelay: '2s' }} />
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        {/* Mobile Header / Desktop floating toggle */}
        {!sidebarOpen && (
          <div className="absolute top-4 left-4 z-30 hidden md:block">
            <button
              onClick={toggleSidebar}
              className="glass-panel-strong rounded-2xl p-3 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:text-slate-900"
            >
              <SidebarIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className="glass-panel-strong md:hidden m-3 mb-0 flex items-center justify-between rounded-2xl px-3 py-3 flex-shrink-0 z-20">
          <button
            onClick={toggleSidebar}
            className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-950"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="truncate px-2 text-sm font-semibold tracking-tight text-slate-900">
            {activePage?.title || 'Workspace'}
          </div>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-hidden relative min-h-0 p-3 md:p-5">
          {activePage ? (
            <>
              {activePage.type === 'document' && <DocumentEditor key={activePage.id} page={activePage} />}
              {activePage.type === 'whiteboard' && <WhiteboardEditor key={activePage.id} page={activePage} />}
              {activePage.type === 'database' && <DatabaseEditor key={activePage.id} page={activePage} />}
            </>
          ) : (
            <div className="glass-panel-strong fade-slide-up relative flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] p-8 md:p-14">
              <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.26),transparent_70%)]" />
              <div className="relative z-10 grid h-full gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
                <div className="flex flex-col justify-center">
                  <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    <Presentation className="h-3.5 w-3.5 text-cyan-700" />
                    Executive Workspace
                  </div>
                  <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                    Build polished docs, boards, and project narratives in one place.
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
                    Designed for demos and stakeholder reviews. Structure ideas fast, then present them in a calm,
                    premium workspace with AI-assisted content generation.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        const id = crypto.randomUUID();
                        await db.pages.add({
                          id,
                          title: 'Executive Brief',
                          type: 'document',
                          content: '',
                          icon: suggestPageIcon('Executive Brief', 'document'),
                          createdAt: Date.now(),
                          updatedAt: Date.now(),
                        });
                        setActivePageId(id);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Start Brief
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-600">
                      <Sparkles className="h-4 w-4 text-cyan-700" />
                      AI-powered structuring
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:justify-self-end">
                  {[
                    ['Narrative-first', 'Craft architecture docs and project summaries with presentation-grade typography.'],
                    ['Spatial thinking', 'Map flows, dependencies, and operating models with whiteboards built for demos.'],
                    ['Boardroom polish', 'Soft depth, restrained motion, and clean hierarchy tuned for stakeholder reviews.'],
                  ].map(([title, desc], index) => (
                    <div
                      key={title}
                      className="glass-panel rounded-[24px] p-5 transition-all duration-300 hover:-translate-y-1"
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      <div className="text-sm font-semibold text-slate-900">{title}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-500">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <AIAssistant />
    </div>
  );
}
