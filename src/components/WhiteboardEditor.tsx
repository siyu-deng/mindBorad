import { Tldraw, createShapeId } from 'tldraw';
import { toRichText } from '@tldraw/tlschema';
import 'tldraw/tldraw.css';
import { useEffect, useState } from 'react';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { ErrorBoundary } from './ErrorBoundary';

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

  const handleMount = (editor: any) => {
    if (page.content?.initialWhiteboardData) {
      const data = page.content.initialWhiteboardData;
      
      const shapes: any[] = [];
      const nodeMap = new Map();

      if (data.nodes) {
        data.nodes.forEach((node: any) => {
          const shapeId = createShapeId(node.id);
          nodeMap.set(node.id, shapeId);
          shapes.push({
            id: shapeId,
            type: 'geo',
            x: node.x || Math.random() * 500,
            y: node.y || Math.random() * 500,
            props: {
              geo: node.type === 'ellipse' ? 'ellipse' : 'rectangle',
              richText: toRichText(node.text || ''),
              w: 150,
              h: 80,
            }
          });
        });
      }

      if (data.edges) {
        data.edges.forEach((edge: any, i: number) => {
          const fromId = nodeMap.get(edge.from);
          const toId = nodeMap.get(edge.to);
          if (fromId && toId) {
            shapes.push({
              id: createShapeId(`edge-${i}`),
              type: 'arrow',
              x: 0,
              y: 0,
              props: {
                start: { type: 'binding', isExact: false, boundShapeId: fromId },
                end: { type: 'binding', isExact: false, boundShapeId: toId },
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
        }, 100);
      }

      // Clear the initial data so it doesn't re-render on next mount
      db.pages.update(page.id, { content: null });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 min-h-0">
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
      <div className="flex-1 relative min-h-0 h-full w-full overflow-hidden">
        <div className="absolute inset-0">
          <ErrorBoundary>
            <Tldraw
              key={page.id}
              persistenceKey={`tldraw-${page.id}`}
              onMount={handleMount}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
