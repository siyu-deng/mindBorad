import {
  Bot,
  Cpu,
  FileText,
  LayoutDashboard,
  PenTool,
  type LucideIcon,
  Workflow,
} from 'lucide-react';
import type { Page } from '../db/db';

const iconMap: Record<string, LucideIcon> = {
  bot: Bot,
  cpu: Cpu,
  file: FileText,
  board: PenTool,
  data: LayoutDashboard,
  workflow: Workflow,
};

export function getPageIconComponent(page: Pick<Page, 'type' | 'icon'>) {
  if (page.icon && iconMap[page.icon]) {
    return iconMap[page.icon];
  }

  switch (page.type) {
    case 'document':
      return FileText;
    case 'whiteboard':
      return PenTool;
    case 'database':
      return LayoutDashboard;
  }
}

export function suggestPageIcon(title: string, type: Page['type']) {
  const normalized = title.toLowerCase();

  if (normalized.includes('openclaw') || normalized.includes('robot') || normalized.includes('机械')) {
    return 'bot';
  }
  if (normalized.includes('架构') || normalized.includes('architecture') || normalized.includes('workflow')) {
    return 'workflow';
  }
  if (normalized.includes('芯片') || normalized.includes('system') || normalized.includes('控制')) {
    return 'cpu';
  }

  if (type === 'whiteboard') return 'board';
  if (type === 'database') return 'data';
  return 'file';
}
