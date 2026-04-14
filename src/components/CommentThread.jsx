import { useState, useEffect, useRef } from 'react'
import { useComments } from '../hooks/useComments.js'

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)   return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Comment({ comment }) {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={`comment ${comment.optimistic ? 'comment-optimistic' : ''}`}>
      <div className="comment-header">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-time" title={comment.created_at}>
          {timeAgo(comment.created_at)}
        </span>
      </div>
      <div className="comment-text">{comment.text}</div>
    </div>
  )
}

export default function CommentThread({ issueId }) {
  const { comments, loading, error, addComment } = useComments(issueId)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState(null)
  const textareaRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || posting) return
    setPosting(true)
    setPostError(null)
    try {
      await addComment(text)
      setText('')
    } catch (err) {
      setPostError(err.message)
    } finally {
      setPosting(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e)
  }

  return (
    <div className="detail-section comment-thread">
      <div className="detail-section-label">
        Comments {!loading && comments.length > 0 && `(${comments.length})`}
      </div>

      <div className="comment-list">
        {loading && <div className="comment-state">Loading…</div>}
        {error && <div className="comment-state comment-error">Error: {error}</div>}
        {!loading && !error && comments.length === 0 && (
          <div className="comment-state comment-empty">No comments yet</div>
        )}
        {comments.map(c => <Comment key={c.id} comment={c} />)}
      </div>

      <form className="comment-compose" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="comment-input"
          rows={3}
          placeholder="Add a comment… (⌘Enter to submit)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={posting}
        />
        {postError && <div className="comment-post-error">{postError}</div>}
        <div className="comment-compose-footer">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={posting || !text.trim()}
          >
            {posting ? 'Posting…' : 'Add Comment'}
          </button>
        </div>
      </form>
    </div>
  )
}
