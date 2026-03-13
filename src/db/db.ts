import Dexie, { type EntityTable } from 'dexie';

export interface Page {
  id: string;
  title: string;
  type: 'document' | 'whiteboard' | 'database';
  content: any;
  createdAt: number;
  updatedAt: number;
  icon?: string;
}

const db = new Dexie('AffineCloneDB') as Dexie & {
  pages: EntityTable<Page, 'id'>;
};

db.version(1).stores({
  pages: 'id, title, type, createdAt, updatedAt'
});

export { db };
