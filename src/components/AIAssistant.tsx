import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { processAIRequest } from '../services/aiService';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { markdownToHtml } from '../lib/markdown';
import { suggestPageIcon } from '../lib/pageIcons';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hi! I can help you create documents, whiteboards, or databases. What do you need?' }
  ]);
  const { setActivePageId } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = prompt.trim();
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await processAIRequest(userMessage);

      if (response.action === 'create_document' && !response.documentContent) {
        throw new Error('AI returned create_document without documentContent');
      }
      if (response.action === 'create_whiteboard' && !response.whiteboardContent) {
        throw new Error('AI returned create_whiteboard without whiteboardContent');
      }
      if (response.action === 'create_database' && !response.databaseContent) {
        throw new Error('AI returned create_database without databaseContent');
      }
      
      setMessages(prev => [...prev, { role: 'ai', text: response.reply }]);

      if (response.action === 'create_document' && response.documentContent) {
        const title = response.title || 'New Document';
        const newPageId = await db.pages.add({
          id: uuidv4(),
          title,
          type: 'document',
          content: markdownToHtml(response.documentContent),
          icon: suggestPageIcon(title, 'document'),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        setActivePageId(newPageId);
      } else if (response.action === 'create_database' && response.databaseContent) {
        const columns = response.databaseContent.columns.map(c => ({
          id: `col-${uuidv4()}`,
          name: c.name,
          type: c.type,
          options: c.options
        }));
        
        const rows = response.databaseContent.rows.map(r => {
          const newRow: any = { id: uuidv4() };
          columns.forEach(col => {
            newRow[col.id] = r[col.name] || '';
          });
          return newRow;
        });

        const title = response.title || 'New Database';
        const newPageId = await db.pages.add({
          id: uuidv4(),
          title,
          type: 'database',
          content: { view: 'table', columns, rows },
          icon: suggestPageIcon(title, 'database'),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        setActivePageId(newPageId);
      } else if (response.action === 'create_whiteboard' && response.whiteboardContent) {
        const title = response.title || 'New Whiteboard';
        const newPageId = await db.pages.add({
          id: uuidv4(),
          title,
          type: 'whiteboard',
          content: { initialWhiteboardData: response.whiteboardContent },
          icon: suggestPageIcon(title, 'whiteboard'),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        setActivePageId(newPageId);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error while processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-[linear-gradient(180deg,#0f172a,#0f766e)] text-white shadow-[0_20px_40px_rgba(15,23,42,0.24)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`glass-panel fixed bottom-6 right-6 z-50 flex w-80 origin-bottom-right flex-col overflow-hidden rounded-[28px] transition-all duration-300 sm:w-[25rem] ${isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}
        style={{ height: '500px', maxHeight: 'calc(100vh - 48px)' }}
      >
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#0f172a,#0f766e)] px-4 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="font-semibold tracking-tight">AI Assistant</h3>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">Presentation Mode</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-xl p-1.5 transition-colors hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.84),rgba(241,245,249,0.5))] p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-6 shadow-[0_10px_24px_rgba(15,23,42,0.05)] ${msg.role === 'user' ? 'bg-[linear-gradient(180deg,#0f172a,#1e293b)] text-white rounded-tr-md' : 'border border-white/70 bg-white/80 text-slate-700 rounded-tl-md'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-md border border-white/70 bg-white/80 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)] flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan-700 animate-spin" />
                <span className="text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-white/60 bg-white/60 p-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me to create something..."
              className="premium-input w-full pl-4 pr-12 py-3 text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="absolute right-2 rounded-xl p-2 text-cyan-700 transition-colors hover:bg-cyan-50 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
