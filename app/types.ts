export type IssueStatus =
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'deferred'
  | 'closed'
  | 'pinned'
  | 'hooked';

export type IssueType =
  | 'task'
  | 'bug'
  | 'feature'
  | 'chore'
  | 'epic'
  | 'decision'
  | 'spike'
  | 'story'
  | 'milestone';

export interface Dependency {
  id: string;
  title: string;
  status: IssueStatus;
  priority: number;
  issue_type: IssueType;
  assignee: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
  dependency_type: 'blocks';
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: number;
  issue_type: IssueType;
  assignee: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
  dependency_count: number;
  dependent_count: number;
  comment_count: number;
  estimate?: number | null;
  estimated_minutes?: number | null;
  due?: string | null;
  due_at?: string | null;
  notes?: string | null;
  design?: string | null;
  acceptance?: string | null;
  acceptance_criteria?: string | null;
  external_ref?: string | null;
  parent?: string | null;
  labels?: string[];
  dependencies?: Dependency[];
}

export interface LabelItem {
  label: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  author: string;
  text: string;
  created_at: string;
  optimistic?: boolean;
}

export interface HealthData {
  ok: boolean;
  projectName: string;
  bdVersion: string;
  cwd: string;
  bd: string;
  error?: string;
}

export interface Memory {
  key: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatsData {
  [key: string]: unknown;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const PRIORITY_LABEL: Record<number, string> = {
  0: 'P0',
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
};

export const TYPE_SHORT: Record<string, string> = {
  bug: 'BUG',
  feature: 'FEAT',
  task: 'TASK',
  chore: 'CHR',
  epic: 'EPIC',
  spike: 'SPK',
  story: 'STR',
  decision: 'DEC',
  milestone: 'MS',
};
