import { Circle, CircleDot, CircleX, CircleCheck, Clock, Pin } from 'lucide-react'

const ICONS = {
  open:        Circle,
  in_progress: CircleDot,
  blocked:     CircleX,
  closed:      CircleCheck,
  deferred:    Clock,
  pinned:      Pin,
}

export default function StatusIcon({ status, size = 14 }) {
  const Icon = ICONS[status] ?? Circle
  return (
    <Icon
      size={size}
      className={`status-icon status-icon-${status}`}
      strokeWidth={1.75}
    />
  )
}
