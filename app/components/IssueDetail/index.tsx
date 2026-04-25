import { Check, ChevronDown, Copy, Ghost, Trash2, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PRIORITY_LABEL } from '../../constants.js';
import { useAddLabel } from '../../hooks/api/useAddLabel.js';
import { useChildren } from '../../hooks/api/useChildren.js';
import { useCloseIssue } from '../../hooks/api/useCloseIssue.js';
import { useDeleteIssue } from '../../hooks/api/useDeleteIssue.js';
import { useEpicStatuses } from '../../hooks/api/useEpicStatuses.js';
import { useLabels } from '../../hooks/api/useLabels.js';
import { useRemoveLabel } from '../../hooks/api/useRemoveLabel.js';
import { useUpdateIssue } from '../../hooks/api/useUpdateIssue.js';
import { useIssue } from '../../hooks/api/useIssues.js';
import { useKeyboard } from '../../hooks/useKeyboard.js';
import { toast } from '../../hooks/useToast.js';
import type { Dependency, EpicStatus, Issue, LabelItem } from '../../types.js';
import CollapsibleSection from '../CollapsibleSection/index.jsx';
import CommentThread from '../CommentThread/index.jsx';
import ConfirmDialog from '../ConfirmDialog.jsx';
import MarkdownContent from '../MarkdownContent/index.jsx';
import StatusIcon from '../StatusIcon/index.jsx';
import './IssueDetail.css';
const ALL_STATUSES = ['open', 'in_progress', 'blocked', 'deferred', 'pinned', 'closed'];

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function DepChip({ dep, onSelect }: { dep: Dependency | Issue; onSelect: (id: string) => void }) {
  return (
    <button className="dep-chip" onClick={() => onSelect(dep.id)} title={dep.title}>
      <StatusIcon status={dep.status} size={12} />
      <span className="dep-chip-id">{dep.id}</span>
      <span className="dep-chip-title">{dep.title}</span>
    </button>
  );
}

function LabelChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: ((label: string) => void) | null;
}) {
  return (
    <span className="label-chip">
      {label}
      {onRemove && (
        <button
          className="label-chip-remove"
          onClick={() => onRemove(label)}
          title={`Remove ${label}`}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

function LabelAddTrigger({ issueId }: { issueId: string }) {
  const allLabels = useLabels();
  const addLabel = useAddLabel(issueId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `label-suggestions-${issueId}`;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function open() {
    setEditing(true);
  }

  async function commit() {
    const trimmed = (inputRef.current?.value ?? value).trim();
    if (!trimmed || busy) {
      close();
      return;
    }
    setBusy(true);
    try {
      await addLabel.mutateAsync(trimmed);
    } catch {
      // SSE will update anyway
    } finally {
      setBusy(false);
      close();
    }
  }

  function close() {
    setEditing(false);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  function handleBlur() {
    setTimeout(() => {
      if (inputRef.current?.value.trim()) {
        commit();
      } else {
        close();
      }
    }, 150);
  }

  if (!editing) {
    return (
      <button className="label-add-trigger" onClick={open}>
        + Add label
      </button>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        className="label-chip-input"
        list={listId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="label…"
        disabled={busy}
      />
      <datalist id={listId}>
        {allLabels.map(({ label }: LabelItem) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </>
  );
}

function StatusDropdown({
  status,
  onChange,
  disabled,
}: {
  status: string;
  onChange: (s: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <span ref={wrapRef} className={`badge badge-${status} status-dropdown-wrap`}>
      <button
        className="status-dropdown-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <StatusIcon status={status} size={12} />
        <span>{status.replace('_', ' ')}</span>
        <ChevronDown size={10} strokeWidth={2} />
      </button>
      {open && (
        <div className="status-dropdown-menu">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className={`status-dropdown-option${s === status ? ' is-current' : ''}`}
              onClick={() => {
                setOpen(false);
                onChange(s);
              }}
            >
              <StatusIcon status={s} size={11} />
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

function CopyIdButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 1500);
    }
  }

  return (
    <button
      className={`btn-copy-id${failed ? ' btn-copy-id--failed' : ''}`}
      onClick={handleCopy}
      title={failed ? 'Copy failed' : 'Copy issue ID'}
      aria-label="Copy issue ID"
    >
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={1.75} />}
    </button>
  );
}

interface IssueDetailProps {
  issueId: string;
  onClose: () => void;
  onSelectIssue?: (id: string) => void;
  onEdit?: (issue: Issue) => void;
  onDelete?: () => void;
}

export default function IssueDetail({
  issueId,
  onClose,
  onSelectIssue,
  onEdit,
  onDelete,
}: IssueDetailProps) {
  const { issue, loading, error, notFound } = useIssue(issueId);
  const { children } = useChildren(issueId);
  const { issue: parentIssue } = useIssue(issue?.parent ?? null);
  const epicStatuses = useEpicStatuses();
  const closeIssue = useCloseIssue();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const removeLabel = useRemoveLabel(issueId);
  const [pendingClose, setPendingClose] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editMenuRef = useRef<HTMLDivElement>(null);

  async function handleAction(fn: () => Promise<unknown>, successMsg: string | null) {
    setActionPending(true);
    try {
      await fn();
      if (successMsg) toast(successMsg, 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setActionPending(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!issue || newStatus === issue.status) return;
    if (newStatus === 'closed') {
      setPendingClose(true);
      return;
    }
    await handleAction(
      () => updateIssue.mutateAsync({ id: issueId, data: { status: newStatus } }),
      `Marked ${newStatus.replace('_', ' ')}`,
    );
  }

  async function handleCloseConfirm() {
    await handleAction(
      () => closeIssue.mutateAsync({ id: issueId, reason: closeReason || undefined }),
      'Issue closed',
    );
    setPendingClose(false);
    setCloseReason('');
  }

  const canClaim = issue?.status === 'open';
  const canClose = issue?.status !== 'closed';

  useEffect(() => {
    if (!editMenuOpen) return;
    function handler(e: MouseEvent) {
      if (editMenuRef.current && !editMenuRef.current.contains(e.target as Node))
        setEditMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editMenuOpen]);

  async function handleDelete() {
    setConfirmDelete(false);
    setEditMenuOpen(false);
    await handleAction(() => deleteIssue.mutateAsync(issueId), 'Issue deleted');
    onDelete?.();
  }

  const detailKeyBindings = useMemo(
    () => ({
      c: () =>
        canClaim &&
        !actionPending &&
        handleAction(
          () => updateIssue.mutateAsync({ id: issueId, data: { claim: true } }),
          'Issue claimed',
        ),
      e: () => issue && onEdit?.(issue),
      x: () => canClose && !pendingClose && setPendingClose(true),
    }),
    [canClaim, actionPending, issueId, issue, onEdit, canClose, pendingClose, updateIssue],
  );
  useKeyboard(detailKeyBindings, !!issue && !pendingClose && !confirmDelete);

  if (loading) return <div className="detail-loading">Loading…</div>;
  if (notFound)
    return (
      <div className="detail-not-found">
        <Ghost size={40} strokeWidth={1.25} className="detail-not-found-icon" />
        <div className="detail-not-found-id">{issueId}</div>
        <div className="detail-not-found-msg">
          Nothing here. This issue doesn&apos;t exist or was deleted.
        </div>
      </div>
    );
  if (error) return <div className="detail-error">Error: {error}</div>;
  if (!issue) return null;

  const blockedBy = issue.dependencies?.filter((d) => d.dependency_type === 'blocks') ?? [];

  const epicStatus: EpicStatus | undefined =
    issue.issue_type === 'epic' ? epicStatuses.get(issue.id) : undefined;
  const epicPct =
    epicStatus && epicStatus.total_children > 0
      ? Math.round((epicStatus.closed_children / epicStatus.total_children) * 100)
      : null;

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Issue"
          message={`Are you sure you want to delete ${issueId}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      <div className="issue-detail">
        <div className="detail-header">
          <div className="detail-header-top">
            <div className="detail-id-group">
              {issue.parent && (
                <>
                  <button
                    className="detail-id detail-parent-link"
                    onClick={() => onSelectIssue?.(issue.parent!)}
                    title="Parent issue"
                  >
                    {issue.parent}
                  </button>
                  <span className="detail-id detail-breadcrumb-sep">/</span>
                </>
              )}
              <span className="detail-id">{issue.id}</span>
              <CopyIdButton id={issue.id} />
            </div>
            <div className="detail-actions-top">
              {canClaim && (
                <button
                  className="btn btn-secondary"
                  disabled={actionPending}
                  onClick={() =>
                    handleAction(
                      () => updateIssue.mutateAsync({ id: issueId, data: { claim: true } }),
                      'Issue claimed',
                    )
                  }
                >
                  Claim
                </button>
              )}
              {onEdit && (
                <div className="btn-split" ref={editMenuRef}>
                  <button
                    className="btn btn-secondary btn-split-main"
                    onClick={() => onEdit(issue)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary btn-split-chevron"
                    onClick={() => setEditMenuOpen((o) => !o)}
                    aria-label="More actions"
                  >
                    <ChevronDown size={12} />
                  </button>
                  {editMenuOpen && (
                    <div className="btn-split-menu">
                      <button
                        className="btn-split-menu-item btn-split-menu-danger"
                        onClick={() => {
                          setEditMenuOpen(false);
                          setConfirmDelete(true);
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button className="btn btn-secondary detail-close-btn" onClick={onClose}>
                <X size={14} />
              </button>
            </div>
          </div>
          <h2 className="detail-title">{issue.title}</h2>
        </div>

        <div className="detail-meta">
          <StatusDropdown
            status={issue.status}
            onChange={handleStatusChange}
            disabled={actionPending}
          />
          {issue.priority !== undefined && (
            <span className={`priority-badge p${issue.priority}`}>
              {PRIORITY_LABEL[issue.priority]}
            </span>
          )}
          {issue.issue_type && <span className="detail-type">{issue.issue_type}</span>}
          {issue.assignee && (
            <span className="detail-assignee">
              <User size={12} strokeWidth={1.75} /> {issue.assignee}
            </span>
          )}
        </div>

        {((issue.estimated_minutes != null && issue.estimated_minutes > 0) ||
          issue.due_at ||
          issue.created_at ||
          issue.closed_at) && (
          <div className="detail-kv-wrap">
            <dl className="detail-kv">
              {issue.estimated_minutes != null && issue.estimated_minutes > 0 && (
                <>
                  <dt>Estimate</dt>
                  <dd>{issue.estimated_minutes} min</dd>
                </>
              )}
              {issue.due_at && (
                <>
                  <dt>Due</dt>
                  <dd>{formatDate(issue.due_at)}</dd>
                </>
              )}
              {issue.created_at && (
                <>
                  <dt>Created</dt>
                  <dd>{formatDate(issue.created_at)}</dd>
                </>
              )}
              {issue.closed_at && (
                <>
                  <dt>Closed</dt>
                  <dd>{formatDate(issue.closed_at)}</dd>
                </>
              )}
            </dl>
          </div>
        )}
        {issue.status === 'closed' && issue.close_reason && issue.close_reason !== 'Closed' && (
          <div className="detail-close-reason">
            <span className="detail-close-reason-label">Close reason</span>
            <span className="detail-close-reason-text">{issue.close_reason}</span>
          </div>
        )}

        {((issue.labels != null && issue.labels.length > 0) || canClose) && (
          <CollapsibleSection name="Labels">
            <div className="label-chips">
              {(issue.labels ?? []).map((label) => (
                <LabelChip
                  key={label}
                  label={label}
                  onRemove={
                    canClose ? () => handleAction(() => removeLabel.mutateAsync(label), null) : null
                  }
                />
              ))}
              {canClose && <LabelAddTrigger issueId={issueId} />}
            </div>
          </CollapsibleSection>
        )}

        {pendingClose && (
          <div className="detail-section detail-actions-bottom">
            <div className="close-reason-row">
              <input
                autoFocus
                className="close-reason-input"
                placeholder="Close reason (optional)"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCloseConfirm();
                  if (e.key === 'Escape') {
                    setPendingClose(false);
                    setCloseReason('');
                  }
                }}
              />
              <button
                className="btn btn-danger"
                disabled={actionPending}
                onClick={handleCloseConfirm}
              >
                Close
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setPendingClose(false);
                  setCloseReason('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {issue.description && (
          <CollapsibleSection name="Description">
            <MarkdownContent text={issue.description} className="detail-description" />
          </CollapsibleSection>
        )}

        {issue.notes && (
          <CollapsibleSection name="Notes">
            <MarkdownContent text={issue.notes} className="detail-description" />
          </CollapsibleSection>
        )}

        {issue.design && (
          <CollapsibleSection name="Design">
            <MarkdownContent text={issue.design} className="detail-description" />
          </CollapsibleSection>
        )}

        {blockedBy.length > 0 && (
          <CollapsibleSection name="Dependencies">
            <div className="dep-group">
              <span className="dep-group-label">Blocked by</span>
              <div className="dep-chips">
                {blockedBy.map((d) => (
                  <DepChip key={d.id} dep={d} onSelect={onSelectIssue ?? (() => {})} />
                ))}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {parentIssue && (
          <CollapsibleSection name="Parent">
            <div className="dep-chips">
              <DepChip dep={parentIssue} onSelect={onSelectIssue ?? (() => {})} />
            </div>
          </CollapsibleSection>
        )}

        {epicStatus && epicPct !== null && (
          <CollapsibleSection name="Progress">
            <div className="epic-detail-progress">
              <div className="epic-detail-progress-track">
                <div className="epic-detail-progress-fill" style={{ width: `${epicPct}%` }} />
              </div>
              <span className="epic-detail-progress-label">
                {epicStatus.closed_children}/{epicStatus.total_children} children closed ({epicPct}
                %)
              </span>
            </div>
          </CollapsibleSection>
        )}

        {children.length > 0 && (
          <CollapsibleSection name="Children">
            <div className="dep-chips">
              {children.map((child) => (
                <DepChip key={child.id} dep={child} onSelect={onSelectIssue ?? (() => {})} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        <CommentThread issueId={issueId} />
      </div>
    </>
  );
}
