import { ChevronRight, Inbox } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ResizableDivider from '../../components/ResizableDivider/index.jsx';
import StatusIcon from '../../components/StatusIcon/index.jsx';
import { PRIORITY_LABEL, TYPE_SHORT } from '../../constants.js';
import { useIssues } from '../../hooks/useIssues.js';
import { useKeyboard } from '../../hooks/useKeyboard.js';
import { useLocalStorageState } from '../../hooks/useLocalStorageState.js';
import type { DetailPanelComponent } from '../../components/DetailPanel/index.js';
import type { Issue } from '../../types.js';
import './ListView.css';

let savedScrollTop = 0;

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Closed', value: 'closed' },
];

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Task', value: 'task' },
  { label: 'Chore', value: 'chore' },
  { label: 'Epic', value: 'epic' },
  { label: 'Spike', value: 'spike' },
  { label: 'Story', value: 'story' },
];

interface IssueRowProps {
  issue: Issue;
  selected: boolean;
  onClick: () => void;
  indent?: boolean;
}

function IssueRow({ issue, selected, onClick, indent }: IssueRowProps) {
  return (
    <button
      className={`issue-row ${selected ? 'selected' : ''} status-${issue.status}${indent ? ' issue-row-indented' : ''}`}
      onClick={onClick}
    >
      <StatusIcon status={issue.status} />
      <span className="issue-row-body">
        <span className="issue-row-title">{issue.title}</span>
        <span className="issue-row-meta">
          <span className="issue-row-id">{issue.id}</span>
          {issue.issue_type && (
            <span className={`badge-type type-${issue.issue_type}`}>
              {TYPE_SHORT[issue.issue_type] ?? issue.issue_type.toUpperCase()}
            </span>
          )}
        </span>
      </span>
      <span className={`priority-badge p${issue.priority ?? 2}`}>
        {PRIORITY_LABEL[issue.priority] ?? 'P2'}
      </span>
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="issue-row skeleton-row">
      <span className="skeleton skeleton-icon" />
      <span className="issue-row-body">
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-meta" />
      </span>
      <span className="skeleton skeleton-badge" />
    </div>
  );
}

interface EpicGroupHeaderProps {
  epic: Issue;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: () => void;
  selected: boolean;
}

function EpicGroupHeader({ epic, collapsed, onToggle, onSelect, selected }: EpicGroupHeaderProps) {
  return (
    <div className={`epic-group-header ${selected ? 'selected' : ''}`}>
      <button
        className="epic-chevron-btn"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={collapsed ? 'Expand' : 'Collapse'}
      >
        <ChevronRight size={12} className={`epic-chevron ${collapsed ? '' : 'expanded'}`} />
      </button>
      <button className="epic-group-body" onClick={onSelect}>
        <StatusIcon status={epic.status} />
        <span className="badge-type type-epic">EPIC</span>
        <span className="epic-group-title">{epic.title}</span>
        <span className={`priority-badge p${epic.priority ?? 2}`}>
          {PRIORITY_LABEL[epic.priority] ?? 'P2'}
        </span>
      </button>
    </div>
  );
}

interface ListViewProps {
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  DetailPanel: DetailPanelComponent;
  onRefreshed: (date: Date) => void;
}

export default function ListView({
  selectedIssueId,
  onSelectIssue,
  DetailPanel,
  onRefreshed,
}: ListViewProps) {
  const [statusFilter, setStatusFilter] = useLocalStorageState('beadee-status-filter', '');
  const [typeFilter, setTypeFilter] = useLocalStorageState('beadee-type-filter', '');
  const [hideClosed, setHideClosed] = useLocalStorageState('beadee-hide-closed', true);
  const [groupByEpic, setGroupByEpic] = useLocalStorageState('beadee-group-by-epic', false);
  const [collapsedEpics, setCollapsedEpics] = useState<Set<string>>(() => new Set());
  const [rawPanelWidth, setListPanelWidth] = useLocalStorageState('beadee-list-panel-width', 320);
  const listPanelWidth = Number(rawPanelWidth) || 320;

  const listRef = useRef<HTMLDivElement>(null);

  const { issues, loading, error } = useIssues(
    { status: statusFilter, type: typeFilter },
    { onRefreshed },
  );

  useEffect(() => {
    const el = listRef.current;
    return () => {
      if (el) savedScrollTop = el.scrollTop;
    };
  }, []);

  useEffect(() => {
    if (!loading && listRef.current && savedScrollTop > 0) {
      listRef.current.scrollTop = savedScrollTop;
    }
  }, [loading]);

  const displayedIssues = useMemo(() => {
    if (!hideClosed || statusFilter === 'closed') return issues;
    return issues.filter((i) => i.status !== 'closed');
  }, [issues, hideClosed, statusFilter]);

  const epicGroups = useMemo(() => {
    if (!groupByEpic) return null;
    const epics = displayedIssues.filter((i) => i.issue_type === 'epic');
    const byParent: Record<string, Issue[]> = {};
    for (const issue of displayedIssues) {
      if (issue.parent) {
        if (!byParent[issue.parent]) byParent[issue.parent] = [];
        byParent[issue.parent].push(issue);
      }
    }
    const epicIds = new Set(epics.map((e) => e.id));
    const orphans = displayedIssues.filter((i) => !epicIds.has(i.id) && !i.parent);
    return { epics, byParent, orphans };
  }, [displayedIssues, groupByEpic]);

  const visibleIssues = useMemo(() => {
    if (!epicGroups) return displayedIssues;
    const result: Issue[] = [];
    for (const epic of epicGroups.epics) {
      result.push(epic);
      if (!collapsedEpics.has(epic.id)) {
        const children = epicGroups.byParent[epic.id] ?? [];
        result.push(...children);
      }
    }
    result.push(...epicGroups.orphans);
    return result;
  }, [epicGroups, collapsedEpics, displayedIssues]);

  const toggleEpic = useCallback((epicId: string) => {
    setCollapsedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  }, []);

  const selectedIdx = useMemo(
    () => visibleIssues.findIndex((i) => i.id === selectedIssueId),
    [visibleIssues, selectedIssueId],
  );

  const navigate = useCallback(
    (dir: number) => {
      if (!visibleIssues.length) return;
      const next =
        selectedIdx === -1
          ? dir > 0
            ? 0
            : visibleIssues.length - 1
          : Math.max(0, Math.min(visibleIssues.length - 1, selectedIdx + dir));
      onSelectIssue(visibleIssues[next].id);
    },
    [visibleIssues, selectedIdx, onSelectIssue],
  );

  const listKeyBindings = useMemo(
    () => ({
      j: () => navigate(1),
      k: () => navigate(-1),
      Enter: () => {
        if (selectedIdx !== -1) onSelectIssue(visibleIssues[selectedIdx].id);
      },
    }),
    [navigate, selectedIdx, visibleIssues, onSelectIssue],
  );
  useKeyboard(listKeyBindings);

  return (
    <div className={`list-view${selectedIssueId ? ' has-detail' : ''}`}>
      <div
        className="list-panel"
        style={{ '--list-panel-width': `${listPanelWidth}px` } as React.CSSProperties}
      >
        <div className="list-panel-toolbar">
          <div className="status-pills">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`pill ${statusFilter === f.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="list-panel-footer-row">
            <select
              className="type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              className={`pill hide-closed-toggle ${hideClosed && statusFilter !== 'closed' ? 'active' : ''}`}
              onClick={() => setHideClosed((v) => !v)}
              title={
                hideClosed
                  ? 'Showing active issues — click to show closed'
                  : 'Click to hide closed issues'
              }
            >
              Hide closed
            </button>
            <button
              className={`pill ${groupByEpic ? 'active' : ''}`}
              onClick={() => setGroupByEpic((v) => !v)}
              title={groupByEpic ? 'Grouped by epic — click to ungroup' : 'Click to group by epic'}
            >
              By epic
            </button>
            <span className="issue-count">
              {loading
                ? '…'
                : `${displayedIssues.length} issue${displayedIssues.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div className="issue-list" ref={listRef}>
          {loading && [1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          {error && <div className="list-state list-error">Error: {error}</div>}
          {!loading && !error && displayedIssues.length === 0 && (
            <div className="list-state list-empty">
              {statusFilter || typeFilter || hideClosed
                ? 'No issues match your filters'
                : 'No issues yet'}
            </div>
          )}
          {epicGroups
            ? epicGroups.epics
                .map((epic) => (
                  <div key={epic.id} className="epic-group">
                    <EpicGroupHeader
                      epic={epic}
                      collapsed={collapsedEpics.has(epic.id)}
                      onToggle={() => toggleEpic(epic.id)}
                      onSelect={() => onSelectIssue(epic.id === selectedIssueId ? null : epic.id)}
                      selected={epic.id === selectedIssueId}
                    />
                    {!collapsedEpics.has(epic.id) &&
                      (epicGroups.byParent[epic.id] ?? []).map((issue) => (
                        <IssueRow
                          key={issue.id}
                          issue={issue}
                          selected={issue.id === selectedIssueId}
                          onClick={() =>
                            onSelectIssue(issue.id === selectedIssueId ? null : issue.id)
                          }
                          indent
                        />
                      ))}
                  </div>
                ))
                .concat(
                  epicGroups.orphans.length > 0
                    ? [
                        <div key="__orphans__" className="epic-group epic-group-orphans">
                          {epicGroups.orphans.map((issue) => (
                            <IssueRow
                              key={issue.id}
                              issue={issue}
                              selected={issue.id === selectedIssueId}
                              onClick={() =>
                                onSelectIssue(issue.id === selectedIssueId ? null : issue.id)
                              }
                            />
                          ))}
                        </div>,
                      ]
                    : [],
                )
            : displayedIssues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  selected={issue.id === selectedIssueId}
                  onClick={() => onSelectIssue(issue.id === selectedIssueId ? null : issue.id)}
                />
              ))}
        </div>
      </div>

      <ResizableDivider currentWidth={listPanelWidth} onResize={setListPanelWidth} minWidth={200} />

      <div className="detail-panel">
        {selectedIssueId ? (
          <DetailPanel issueId={selectedIssueId} onClose={() => onSelectIssue(null)} />
        ) : (
          <div className="detail-empty">
            <Inbox size={32} className="detail-empty-icon" strokeWidth={1.25} />
            <p>Select an issue to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
