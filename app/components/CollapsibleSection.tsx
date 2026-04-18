import { ChevronDown } from 'lucide-react';
import { useLocalStorageState } from '../hooks/useLocalStorageState.js';

interface CollapsibleSectionProps {
  name: string;
  storageKey?: string;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  name,
  storageKey,
  children,
  className,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useLocalStorageState(
    `beadee-collapsed-${storageKey ?? name}`,
    false,
  );

  return (
    <div
      className={`detail-section${collapsed ? ' is-collapsed' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        className="detail-section-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="detail-section-label">{name}</span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={`section-chevron${collapsed ? ' is-up' : ''}`}
        />
      </button>
      {!collapsed && <div className="detail-section-body">{children}</div>}
    </div>
  );
}
