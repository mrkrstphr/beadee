import { useState, useEffect, useRef } from 'react';
import { useComments } from '../../hooks/useComments.js';
import MarkdownContent from '../MarkdownContent/index.jsx';
import CollapsibleSection from '../CollapsibleSection/index.jsx';
import type { Comment } from '../../types.js';
import './CommentThread.css';

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function CommentItem({ comment, tick: _tick }: { comment: Comment; tick: number }) {
  return (
    <div className={`comment ${comment.optimistic ? 'comment-optimistic' : ''}`}>
      <div className="comment-header">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-time" title={comment.created_at}>
          {timeAgo(comment.created_at)}
        </span>
      </div>
      <MarkdownContent text={comment.text} className="comment-text" />
    </div>
  );
}

interface CommentThreadProps {
  issueId: string;
}

export default function CommentThread({ issueId }: CommentThreadProps) {
  const { comments, loading, error, addComment } = useComments(issueId);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      await addComment(text);
      setText('');
    } catch (err) {
      setPostError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
      handleSubmit(e as unknown as React.FormEvent);
  }

  const sectionName = `Comments${!loading && comments.length > 0 ? ` (${comments.length})` : ''}`;

  return (
    <CollapsibleSection name={sectionName} storageKey="Comments" className="comment-thread">
      <div className="comment-list">
        {loading && <div className="comment-state">Loading…</div>}
        {error && <div className="comment-state comment-error">Error: {error}</div>}
        {!loading && !error && comments.length === 0 && (
          <div className="comment-state comment-empty">No comments yet</div>
        )}
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} tick={tick} />
        ))}
      </div>

      <form className="comment-compose" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="comment-input"
          rows={3}
          placeholder="Add a comment… (⌘Enter to submit)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={posting}
        />
        {postError && <div className="comment-post-error">{postError}</div>}
        <div className="comment-compose-footer">
          <button type="submit" className="btn btn-primary" disabled={posting || !text.trim()}>
            {posting ? 'Posting…' : 'Add Comment'}
          </button>
        </div>
      </form>
    </CollapsibleSection>
  );
}
