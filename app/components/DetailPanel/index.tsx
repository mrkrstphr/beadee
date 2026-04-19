import { createContext, useContext } from 'react';
import type { Issue } from '../../types.js';
import IssueDetail from '../IssueDetail/index.jsx';

interface DetailPanelCtx {
  onSelectIssue: (id: string) => void;
  onEdit: (issue: Issue) => void;
  onDelete: () => void;
}

export const DetailPanelContext = createContext<DetailPanelCtx | null>(null);

export interface DetailPanelProps {
  issueId: string;
  onClose: () => void;
}

export type DetailPanelComponent = React.ComponentType<DetailPanelProps>;

export default function DetailPanel({ issueId, onClose }: DetailPanelProps) {
  const ctx = useContext(DetailPanelContext)!;
  return (
    <IssueDetail
      issueId={issueId}
      onClose={onClose}
      onSelectIssue={ctx.onSelectIssue}
      onEdit={ctx.onEdit}
      onDelete={ctx.onDelete}
    />
  );
}
