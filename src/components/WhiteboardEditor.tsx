import { Tldraw, createShapeId, getSnapshot, loadSnapshot, toRichText } from 'tldraw';
import 'tldraw/tldraw.css';
import { useEffect, useRef, useState } from 'react';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { ErrorBoundary } from './ErrorBoundary';

interface LegacyWhiteboardData {
  nodes?: Array<{ id: string; text?: string; type?: 'rectangle' | 'ellipse'; x?: number; y?: number }>;
  edges?: Array<{ from: string; to: string; text?: string }>;
}

interface WhiteboardContent {
  snapshot?: unknown;
  initialWhiteboardData?: LegacyWhiteboardData;
}

export function WhiteboardEditor({ page }: { page: Page }) {
  const [title, setTitle] = useState(page.title);
  const saveTimeoutRef = useRef<number | null>(null);
  const { sidebarOpen, toggleSidebar } = useStore();
  const content = (page.content as WhiteboardContent | null) ?? null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    db.pages.update(page.id, { title: newTitle, updatedAt: Date.now() });
  };

  useEffect(() => {
    setTitle(page.title);
  }, [page.id]);

  const handleMount = (editor: any) => {
    const saveSnapshot = () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        db.pages.update(page.id, {
          content: { snapshot: getSnapshot(editor.store) },
          updatedAt: Date.now(),
        });
      }, 400);
    };

    if (content?.snapshot) {
      loadSnapshot(editor.store, content.snapshot as any);
    } else if (content?.initialWhiteboardData) {
      const data = content.initialWhiteboardData;
      const shapes: any[] = [];
      const nodeMap = new Map();
      const nodePositions = new Map<string, { x: number; y: number; w: number; h: number }>();

      if (data.nodes) {
        data.nodes.forEach((node: any) => {
          const shapeId = createShapeId(node.id);
          const x = node.x || Math.random() * 500;
          const y = node.y || Math.random() * 500;
          const w = 150;
          const h = 80;
          nodeMap.set(node.id, shapeId);
          nodePositions.set(node.id, { x, y, w, h });
          shapes.push({
            id: shapeId,
            type: 'geo',
            x,
            y,
            props: {
              geo: node.type === 'ellipse' ? 'ellipse' : 'rectangle',
              richText: toRichText(node.text || ''),
              w,
              h,
            }
          });
        });
      }

      if (data.edges) {
        data.edges.forEach((edge: any, i: number) => {
          const fromId = nodeMap.get(edge.from);
          const toId = nodeMap.get(edge.to);
          const fromNode = nodePositions.get(edge.from);
          const toNode = nodePositions.get(edge.to);

          if (fromId && toId && fromNode && toNode) {
            shapes.push({
              id: createShapeId(`edge-${i}`),
              type: 'arrow',
              x: 0,
              y: 0,
              props: {
                start: {
                  x: fromNode.x + fromNode.w / 2,
                  y: fromNode.y + fromNode.h / 2,
                },
                end: {
                  x: toNode.x + toNode.w / 2,
                  y: toNode.y + toNode.h / 2,
                },
                richText: toRichText(edge.text || '')
              }
            });
          }
        });
      }

      if (shapes.length > 0) {
        editor.createShapes(shapes);
        setTimeout(() => {
          editor.zoomToFit();
          saveSnapshot();
        }, 100);
      }
    }

    const unlisten = editor.store.listen(
      () => {
        saveSnapshot();
      },
      { source: 'user', scope: 'document' }
    );

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      unlisten();
    };
  };

  return (
    <div className="glass-panel-strong fade-slide-up flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[32px]">
      <div className="flex-shrink-0 border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.86))] px-5 py-4 md:px-7 md:py-5 z-10">
        <div className="flex items-center gap-2 md:gap-4 w-full">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Whiteboard"
            className="min-w-0 flex-1 border-none bg-transparent text-xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300 md:text-2xl"
          />
          <span className="whitespace-nowrap rounded-full border border-cyan-100 bg-cyan-50/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-800 md:text-xs">
            Saved locally
          </span>
        </div>
      </div>
      <div className="relative h-full min-h-0 flex-1 w-full overflow-hidden bg-[linear-gradient(180deg,rgba(241,245,249,0.45),rgba(226,232,240,0.25))]">
        <div className="absolute inset-0">
          <ErrorBoundary>
            <Tldraw
              key={page.id}
              onMount={handleMount}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
