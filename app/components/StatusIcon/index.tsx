import { Circle, CircleDot, CircleX, CircleCheck, Clock, Pin } from 'lucide-react';
import type { IssueStatus } from '../../types.js';
import './StatusIcon.css';

const ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
> = {
  open: Circle,
  in_progress: CircleDot,
  blocked: CircleX,
  closed: CircleCheck,
  deferred: Clock,
  pinned: Pin,
};

interface StatusIconProps {
  status: IssueStatus | string;
  size?: number;
}

export default function StatusIcon({ status, size = 14 }: StatusIconProps) {
  const Icon = ICONS[status] ?? Circle;
  return <Icon size={size} className={`status-icon status-icon-${status}`} strokeWidth={1.75} />;
}
