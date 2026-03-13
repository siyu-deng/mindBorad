import { useState, useEffect } from 'react';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { Plus, Table as TableIcon, LayoutGrid, MoreHorizontal, Trash2, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Column {
  id: string;
  name: string;
  type: 'text' | 'status' | 'date';
  options?: string[];
}

interface Row {
  id: string;
  [key: string]: any;
}

interface DatabaseContent {
  view: 'table' | 'kanban';
  columns: Column[];
  rows: Row[];
}

export function DatabaseEditor({ page }: { page: Page }) {
  const [title, setTitle] = useState(page.title);
  const { sidebarOpen, toggleSidebar } = useStore();

  const content: DatabaseContent = page.content || { view: 'table', columns: [], rows: [] };
  const [view, setView] = useState<'table' | 'kanban'>(content.view || 'table');
  const [columns, setColumns] = useState<Column[]>(content.columns || [
    { id: 'col-1', name: 'Name', type: 'text' },
    { id: 'col-2', name: 'Status', type: 'status', options: ['To Do', 'In Progress', 'Done'] }
  ]);
  const [rows, setRows] = useState<Row[]>(content.rows || []);

  useEffect(() => {
    setTitle(page.title);
    const newContent = page.content || { view: 'table', columns: [], rows: [] };
    setView(newContent.view || 'table');
    setColumns(newContent.columns || [
      { id: 'col-1', name: 'Name', type: 'text' },
      { id: 'col-2', name: 'Status', type: 'status', options: ['To Do', 'In Progress', 'Done'] }
    ]);
    setRows(newContent.rows || []);
  }, [page.id]);

  const saveContent = (newView: 'table' | 'kanban', newCols: Column[], newRows: Row[]) => {
    db.pages.update(page.id, {
      content: { view: newView, columns: newCols, rows: newRows },
      updatedAt: Date.now()
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    db.pages.update(page.id, { title: newTitle, updatedAt: Date.now() });
  };

  const addRow = () => {
    const newRow: Row = { id: uuidv4() };
    columns.forEach(col => {
      newRow[col.id] = col.type === 'status' && col.options ? col.options[0] : '';
    });
    const newRows = [...rows, newRow];
    setRows(newRows);
    saveContent(view, columns, newRows);
  };

  const updateRow = (rowId: string, colId: string, value: any) => {
    const newRows = rows.map(r => r.id === rowId ? { ...r, [colId]: value } : r);
    setRows(newRows);
    saveContent(view, columns, newRows);
  };

  const deleteRow = (rowId: string) => {
    const newRows = rows.filter(r => r.id !== rowId);
    setRows(newRows);
    saveContent(view, columns, newRows);
  };

  const addColumn = () => {
    const newCol: Column = { id: `col-${uuidv4()}`, name: `New Column`, type: 'text' };
    const newCols = [...columns, newCol];
    setColumns(newCols);
    saveContent(view, newCols, rows);
  };

  const updateColumnName = (colId: string, newName: string) => {
    const newCols = columns.map(c => c.id === colId ? { ...c, name: newName } : c);
    setColumns(newCols);
    saveContent(view, newCols, rows);
  };

  const updateColumnType = (colId: string, newType: 'text' | 'status' | 'date') => {
    const newCols = columns.map(c => {
      if (c.id === colId) {
        const updatedCol = { ...c, type: newType };
        if (newType === 'status' && !updatedCol.options) {
          updatedCol.options = ['To Do', 'In Progress', 'Done'];
        }
        return updatedCol;
      }
      return c;
    });
    setColumns(newCols);
    saveContent(view, newCols, rows);
  };

  const deleteColumn = (colId: string) => {
    const newCols = columns.filter(c => c.id !== colId);
    setColumns(newCols);
    saveContent(view, newCols, rows);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceStatus = source.droppableId;
      const destStatus = destination.droppableId;
      const statusCol = columns.find(c => c.type === 'status');
      
      if (statusCol) {
        const draggedRowId = result.draggableId;
        const newRows = rows.map(r => {
          if (r.id === draggedRowId) {
            return { ...r, [statusCol.id]: destStatus };
          }
          return r;
        });
        setRows(newRows);
        saveContent(view, columns, newRows);
      }
    }
  };

  return (
    <div className="glass-panel-strong fade-slide-up flex h-full w-full flex-col overflow-hidden rounded-[32px]">
      <div className="flex-shrink-0 border-b border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.84))] px-5 py-5 md:px-8 md:py-7 flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Database"
          className="border-none bg-transparent text-3xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-300 md:text-5xl"
        />
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 hide-scrollbar">
          <button
            onClick={() => { setView('table'); saveContent('table', columns, rows); }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${view === 'table' ? 'bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]' : 'bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900'}`}
          >
            <TableIcon className="w-4 h-4" /> Table
          </button>
          <button
            onClick={() => { setView('kanban'); saveContent('kanban', columns, rows); }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${view === 'kanban' ? 'bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]' : 'bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[linear-gradient(180deg,rgba(241,245,249,0.45),rgba(226,232,240,0.18))] p-4 md:p-8">
        {view === 'table' ? (
          <div className="max-w-6xl mx-auto">
            <div className="glass-panel rounded-[28px] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-white/75">
                  <tr className="border-b border-slate-200/80">
                    {columns.map(col => (
                      <th key={col.id} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0 group relative min-w-[120px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={col.name}
                              onChange={(e) => updateColumnName(col.id, e.target.value)}
                              className="bg-transparent border-none outline-none w-full text-gray-500 font-semibold uppercase tracking-wider focus:text-indigo-600 focus:bg-indigo-50/50 rounded px-1 -ml-1 transition-colors"
                            />
                            {columns.length > 1 && (
                              <button 
                                onClick={() => deleteColumn(col.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400 transition-opacity"
                                title="Delete Column"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <select
                            value={col.type}
                            onChange={(e) => updateColumnType(col.id, e.target.value as any)}
                            className="text-[10px] bg-transparent border border-gray-200 rounded px-1 py-0.5 text-gray-500 outline-none w-fit cursor-pointer hover:bg-gray-50"
                          >
                            <option value="text">Text</option>
                            <option value="status">Status</option>
                            <option value="date">Date</option>
                          </select>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 w-10">
                      <button onClick={addColumn} className="p-1 hover:bg-gray-200 rounded text-gray-400">
                        <Plus className="w-4 h-4" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                      {columns.map(col => (
                        <td key={col.id} className="px-4 py-2 border-r border-gray-100 last:border-r-0">
                          {col.type === 'status' ? (
                            <select
                              value={row[col.id] || ''}
                              onChange={(e) => updateRow(row.id, col.id, e.target.value)}
                              className="bg-transparent border-none outline-none text-sm w-full cursor-pointer"
                            >
                              {col.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : col.type === 'date' ? (
                            <input
                              type="date"
                              value={row[col.id] || ''}
                              onChange={(e) => updateRow(row.id, col.id, e.target.value)}
                              className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
                            />
                          ) : (
                            <input
                              type="text"
                              value={row[col.id] || ''}
                              onChange={(e) => updateRow(row.id, col.id, e.target.value)}
                              className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-300"
                              placeholder="Empty"
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => deleteRow(row.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-red-500 rounded transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-3">
                      <button onClick={addRow} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium">
                        <Plus className="w-4 h-4" /> New Row
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 md:gap-6 h-full overflow-x-auto pb-4 hide-scrollbar">
            <DragDropContext onDragEnd={onDragEnd}>
              {columns.find(c => c.type === 'status')?.options?.map(status => (
                <div key={status} className="flex-shrink-0 w-72 flex flex-col bg-gray-100/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                      {status}
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        {rows.filter(r => r[columns.find(c => c.type === 'status')!.id] === status).length}
                      </span>
                    </h3>
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 min-h-[150px] transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-gray-200/50' : ''}`}
                      >
                        <div className="space-y-2">
                          {rows.filter(r => r[columns.find(c => c.type === 'status')!.id] === status).map((row, index) => (
                            <Draggable key={row.id} draggableId={row.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 group ${snapshot.isDragging ? 'shadow-md ring-2 ring-indigo-500 ring-opacity-50' : 'hover:border-gray-300'}`}
                                >
                                  {columns.filter(c => c.type !== 'status').map(col => (
                                    <div key={col.id} className="mb-1 last:mb-0">
                                      {col.name === 'Name' ? (
                                        <div className="font-medium text-gray-800 text-sm">{row[col.id] || 'Untitled'}</div>
                                      ) : (
                                        <div className="text-xs text-gray-500 flex gap-1">
                                          <span className="font-medium">{col.name}:</span> {row[col.id] || '-'}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  <div className="mt-2 flex justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => deleteRow(row.id)} className="p-1 hover:bg-red-50 text-red-500 rounded">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                        <button
                          onClick={() => {
                            const newRow: Row = { id: uuidv4() };
                            columns.forEach(col => {
                              newRow[col.id] = col.type === 'status' ? status : '';
                            });
                            const newRows = [...rows, newRow];
                            setRows(newRows);
                            saveContent(view, columns, newRows);
                          }}
                          className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg font-medium transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Add Item
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </DragDropContext>
          </div>
        )}
      </div>
    </div>
  );
}
