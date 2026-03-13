import { Sidebar } from './components/Sidebar';
import { DocumentEditor } from './components/DocumentEditor';
import { WhiteboardEditor } from './components/WhiteboardEditor';
import { DatabaseEditor } from './components/DatabaseEditor';
import { AIAssistant } from './components/AIAssistant';
import { useStore } from './store/useStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/db';
import { FileText, Plus, Menu, Sidebar as SidebarIcon } from 'lucide-react';

export default function App() {
  const { activePageId, setActivePageId, sidebarOpen, toggleSidebar } = useStore();
  const activePage = useLiveQuery(
    () => activePageId ? db.pages.get(activePageId) : undefined,
    [activePageId]
  );

  return (
    <div className="flex h-[100dvh] w-full bg-white overflow-hidden font-sans text-gray-900">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        {/* Mobile Header / Desktop floating toggle */}
        {!sidebarOpen && (
          <div className="absolute top-4 left-4 z-30 hidden md:block">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm"
            >
              <SidebarIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-200 bg-white flex-shrink-0 z-20">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-semibold text-gray-800 truncate px-2 text-sm">
            {activePage?.title || 'Workspace'}
          </div>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-hidden relative min-h-0">
          {activePage ? (
            <>
              {activePage.type === 'document' && <DocumentEditor key={activePage.id} page={activePage} />}
              {activePage.type === 'whiteboard' && <WhiteboardEditor key={activePage.id} page={activePage} />}
              {activePage.type === 'database' && <DatabaseEditor key={activePage.id} page={activePage} />}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 p-6">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-indigo-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2 text-center">Welcome to your Workspace</h2>
              <p className="text-sm text-gray-500 max-w-sm text-center mb-8">
                Create a new document, whiteboard, or database to get started. All your data is stored securely on your local device.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const id = crypto.randomUUID();
                    await db.pages.add({
                      id,
                      title: 'Untitled Document',
                      type: 'document',
                      content: '',
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    });
                    setActivePageId(id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Document
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <AIAssistant />
    </div>
  );
}
