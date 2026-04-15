import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Meta, Links, Outlet, ScrollRestoration, Scripts } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { RefreshCw, Settings, Pin, Clock, CircleCheck, CircleX, CircleDot, Circle, X, User, Check, Copy, Inbox } from "lucide-react";
import { watch } from "node:fs";
import { join, basename as basename$1 } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access } from "node:fs/promises";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const themeScript = `
  try {
    const t = localStorage.getItem('beadee-theme') || 'dark'
    document.documentElement.dataset.theme =
      t === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : t
  } catch(e) {}
`;
const root = UNSAFE_withComponentProps(function Root() {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx("title", {
        children: "beadee"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {}), /* @__PURE__ */ jsx("script", {
        dangerouslySetInnerHTML: {
          __html: themeScript
        }
      })]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: root
}, Symbol.toStringTag, { value: "Module" }));
const API$1 = "/api";
const FALLBACK_POLL_INTERVAL = 3e4;
const sseSubscribers = /* @__PURE__ */ new Set();
function notifyAll() {
  for (const fn of sseSubscribers) fn();
}
let sseInstance = null;
function ensureSSE() {
  if (sseInstance) return;
  function connect() {
    sseInstance = new EventSource(`${API$1}/events`);
    sseInstance.onmessage = () => notifyAll();
    sseInstance.onerror = () => {
      sseInstance.close();
      sseInstance = null;
      setTimeout(connect, 5e3);
    };
  }
  connect();
  setInterval(() => {
    if (document.visibilityState === "visible") notifyAll();
  }, FALLBACK_POLL_INTERVAL);
}
function subscribeTick(fn) {
  sseSubscribers.add(fn);
  ensureSSE();
  return () => sseSubscribers.delete(fn);
}
async function apiFetch$1(path, options = {}) {
  const res = await fetch(`${API$1}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status });
  }
  return res.json();
}
function useIssues(filters = {}, { onRefreshed } = {}) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  useRef(null);
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.search) params.set("search", filters.search);
    const qs = params.toString();
    return qs ? `/issues?${qs}` : "/issues";
  }, [filters.status, filters.type, filters.search]);
  const fetchIssues = useCallback(async (isPoll = false) => {
    var _a;
    if (isPoll) setPolling(true);
    try {
      const data = await apiFetch$1(buildUrl());
      setIssues(data);
      const now = /* @__PURE__ */ new Date();
      setLastUpdated(now);
      (_a = onRefreshedRef.current) == null ? void 0 : _a.call(onRefreshedRef, now);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, [buildUrl]);
  const refetch = useCallback(() => fetchIssues(), [fetchIssues]);
  useEffect(() => {
    setLoading(true);
    fetchIssues();
    const unsub = subscribeTick(() => {
      if (document.visibilityState === "visible") fetchIssues(true);
    });
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchIssues(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchIssues]);
  return { issues, loading, polling, error, refetch, lastUpdated };
}
function useIssue(id) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!id) {
      setIssue(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch$1(`/issues/${id}`).then((data) => {
      if (!cancelled) {
        setIssue(data);
        setError(null);
      }
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return { issue, loading, error };
}
function useHealth() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    apiFetch$1("/health").then((data) => {
      setHealth(data);
      setError(null);
    }).catch((err) => setError(err.message));
  }, []);
  return { health, error };
}
async function createIssue(data) {
  return apiFetch$1("/issues", { method: "POST", body: JSON.stringify(data) });
}
async function updateIssue(id, data) {
  return apiFetch$1(`/issues/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}
async function closeIssue(id, reason) {
  return apiFetch$1(`/issues/${id}/close`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {})
  });
}
function timeAgo$1(date) {
  if (!date) return null;
  const secs = Math.floor((Date.now() - date.getTime()) / 1e3);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}
function RefreshIndicator({ lastUpdated, polling }) {
  const [label, setLabel] = useState(null);
  useEffect(() => {
    if (!lastUpdated) return;
    setLabel(timeAgo$1(lastUpdated));
    const t = setInterval(() => setLabel(timeAgo$1(lastUpdated)), 5e3);
    return () => clearInterval(t);
  }, [lastUpdated]);
  return /* @__PURE__ */ jsxs("div", { className: "refresh-indicator", title: label ? `Updated ${label}` : "Waiting for data…", children: [
    /* @__PURE__ */ jsx(RefreshCw, { size: 13, strokeWidth: 1.75, className: polling ? "spinning" : "" }),
    label && /* @__PURE__ */ jsxs("span", { className: "refresh-label", children: [
      "Updated ",
      label
    ] })
  ] });
}
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
function Header({ activeTab, onTabChange, search, onSearchChange, onNewIssue, lastUpdated, polling }) {
  const { health } = useHealth();
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch]);
  const showSearch = activeTab !== "settings";
  const showNew = activeTab !== "settings";
  return /* @__PURE__ */ jsxs("header", { className: "header", children: [
    /* @__PURE__ */ jsxs("div", { className: "header-left", children: [
      /* @__PURE__ */ jsxs("div", { className: "header-brand", children: [
        /* @__PURE__ */ jsx("span", { className: "logo", children: "beadee" }),
        (health == null ? void 0 : health.projectName) && /* @__PURE__ */ jsx("span", { className: "header-project", children: health.projectName })
      ] }),
      /* @__PURE__ */ jsxs("nav", { className: "tabs", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: `tab ${activeTab === "list" ? "active" : ""}`,
            onClick: () => onTabChange("list"),
            children: "List"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: `tab ${activeTab === "kanban" ? "active" : ""}`,
            onClick: () => onTabChange("kanban"),
            children: "Board"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "header-right", children: [
      showSearch && /* @__PURE__ */ jsx(
        "input",
        {
          className: "header-search",
          type: "search",
          placeholder: "Search issues…",
          value: localSearch,
          onChange: (e) => setLocalSearch(e.target.value)
        }
      ),
      /* @__PURE__ */ jsx(RefreshIndicator, { lastUpdated, polling }),
      showNew && /* @__PURE__ */ jsx("button", { className: "btn btn-primary", onClick: onNewIssue, children: "+ New" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `btn btn-secondary cog-btn ${activeTab === "settings" ? "active" : ""}`,
          onClick: () => onTabChange(activeTab === "settings" ? "list" : "settings"),
          title: "Settings",
          "aria-label": "Settings",
          children: /* @__PURE__ */ jsx(Settings, { size: 15, strokeWidth: 1.75 })
        }
      )
    ] })
  ] });
}
let _addToast = null;
function toast(message, type = "success") {
  _addToast == null ? void 0 : _addToast({ message, type, id: Date.now() + Math.random() });
}
function useToastProvider() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const add = useCallback(({ message, type, id }) => {
    setToasts((ts) => [...ts, { message, type, id }]);
    timers.current[id] = setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 2500);
  }, []);
  _addToast = add;
  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);
  return { toasts, dismiss };
}
function useKeyboard(bindings, active = true) {
  useEffect(() => {
    if (!active) return;
    function handler(e) {
      var _a;
      const tag = (_a = document.activeElement) == null ? void 0 : _a.tagName;
      if (e.key !== "Escape" && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const fn = bindings[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [bindings, active]);
}
const API = "/api";
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status });
  }
  return res.json();
}
function useComments(issueId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!issueId) {
      setComments([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch(`/issues/${issueId}/comments`).then((data) => {
      if (!cancelled) setComments(data);
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [issueId]);
  const addComment = useCallback(async (text) => {
    if (!(text == null ? void 0 : text.trim())) return;
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      issue_id: issueId,
      author: "You",
      text: text.trim(),
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      optimistic: true
    };
    setComments((cs) => [...cs, optimistic]);
    try {
      const saved = await apiFetch(`/issues/${issueId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: text.trim() })
      });
      setComments((cs) => cs.map((c) => c.id === optimistic.id ? saved : c));
    } catch (err) {
      setComments((cs) => cs.filter((c) => c.id !== optimistic.id));
      toast(err.message, "error");
      throw err;
    }
  }, [issueId]);
  return { comments, loading, error, addComment };
}
function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1e3);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric" });
}
function Comment({ comment }) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 3e4);
    return () => clearInterval(t);
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: `comment ${comment.optimistic ? "comment-optimistic" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "comment-header", children: [
      /* @__PURE__ */ jsx("span", { className: "comment-author", children: comment.author }),
      /* @__PURE__ */ jsx("span", { className: "comment-time", title: comment.created_at, children: timeAgo(comment.created_at) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "comment-text", children: comment.text })
  ] });
}
function CommentThread({ issueId }) {
  const { comments, loading, error, addComment } = useComments(issueId);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const textareaRef = useRef(null);
  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      await addComment(text);
      setText("");
    } catch (err) {
      setPostError(err.message);
    } finally {
      setPosting(false);
    }
  }
  function handleKeyDown(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
  }
  return /* @__PURE__ */ jsxs("div", { className: "detail-section comment-thread", children: [
    /* @__PURE__ */ jsxs("div", { className: "detail-section-label", children: [
      "Comments ",
      !loading && comments.length > 0 && `(${comments.length})`
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "comment-list", children: [
      loading && /* @__PURE__ */ jsx("div", { className: "comment-state", children: "Loading…" }),
      error && /* @__PURE__ */ jsxs("div", { className: "comment-state comment-error", children: [
        "Error: ",
        error
      ] }),
      !loading && !error && comments.length === 0 && /* @__PURE__ */ jsx("div", { className: "comment-state comment-empty", children: "No comments yet" }),
      comments.map((c) => /* @__PURE__ */ jsx(Comment, { comment: c }, c.id))
    ] }),
    /* @__PURE__ */ jsxs("form", { className: "comment-compose", onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsx(
        "textarea",
        {
          ref: textareaRef,
          className: "comment-input",
          rows: 3,
          placeholder: "Add a comment… (⌘Enter to submit)",
          value: text,
          onChange: (e) => setText(e.target.value),
          onKeyDown: handleKeyDown,
          disabled: posting
        }
      ),
      postError && /* @__PURE__ */ jsx("div", { className: "comment-post-error", children: postError }),
      /* @__PURE__ */ jsx("div", { className: "comment-compose-footer", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "btn btn-primary",
          disabled: posting || !text.trim(),
          children: posting ? "Posting…" : "Add Comment"
        }
      ) })
    ] })
  ] });
}
const ICONS = {
  open: Circle,
  in_progress: CircleDot,
  blocked: CircleX,
  closed: CircleCheck,
  deferred: Clock,
  pinned: Pin
};
function StatusIcon({ status, size = 14 }) {
  const Icon = ICONS[status] ?? Circle;
  return /* @__PURE__ */ jsx(
    Icon,
    {
      size,
      className: `status-icon status-icon-${status}`,
      strokeWidth: 1.75
    }
  );
}
const PRIORITY_LABEL$2 = { 0: "P0", 1: "P1", 2: "P2", 3: "P3", 4: "P4" };
function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(void 0, { year: "numeric", month: "short", day: "numeric" });
}
function DepChip({ dep, onSelect }) {
  return /* @__PURE__ */ jsxs("button", { className: "dep-chip", onClick: () => onSelect(dep.id), title: dep.title, children: [
    /* @__PURE__ */ jsx(StatusIcon, { status: dep.status, size: 12 }),
    /* @__PURE__ */ jsx("span", { className: "dep-chip-id", children: dep.id }),
    /* @__PURE__ */ jsx("span", { className: "dep-chip-title", children: dep.title })
  ] });
}
function CopyIdButton({ id }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return /* @__PURE__ */ jsx(
    "button",
    {
      className: "btn-copy-id",
      onClick: handleCopy,
      title: "Copy issue ID",
      "aria-label": "Copy issue ID",
      children: copied ? /* @__PURE__ */ jsx(Check, { size: 13, strokeWidth: 2.5 }) : /* @__PURE__ */ jsx(Copy, { size: 13, strokeWidth: 1.75 })
    }
  );
}
function IssueDetail({ issueId, onClose, onSelectIssue, onEdit, onRefresh }) {
  var _a, _b, _c;
  const { issue, loading, error } = useIssue(issueId);
  const [closing, setClosing] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [actionPending, setActionPending] = useState(false);
  async function handleAction(fn, successMsg) {
    setActionPending(true);
    try {
      await fn();
      onRefresh == null ? void 0 : onRefresh();
      if (successMsg) toast(successMsg, "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setActionPending(false);
    }
  }
  async function handleClose() {
    if (!closing) {
      setClosing(true);
      return;
    }
    await handleAction(
      () => closeIssue(issueId, closeReason || void 0),
      "Issue closed"
    );
    setClosing(false);
    setCloseReason("");
  }
  const canClaim = (issue == null ? void 0 : issue.status) === "open";
  const canInProgress = (issue == null ? void 0 : issue.status) === "open" || (issue == null ? void 0 : issue.status) === "blocked";
  const canBlock = (issue == null ? void 0 : issue.status) === "in_progress" || (issue == null ? void 0 : issue.status) === "open";
  const canClose = (issue == null ? void 0 : issue.status) !== "closed";
  useKeyboard({
    c: () => canClaim && !actionPending && handleAction(() => updateIssue(issueId, { claim: true }), "Issue claimed"),
    e: () => issue && (onEdit == null ? void 0 : onEdit(issue)),
    x: () => canClose && !closing && setClosing(true)
  }, !!issue && !closing);
  if (loading) return /* @__PURE__ */ jsx("div", { className: "detail-loading", children: "Loading…" });
  if (error) return /* @__PURE__ */ jsxs("div", { className: "detail-error", children: [
    "Error: ",
    error
  ] });
  if (!issue) return null;
  const blockedBy = ((_a = issue.dependencies) == null ? void 0 : _a.filter((d) => d.dependency_type === "blocks")) ?? [];
  const blocking = ((_b = issue.dependencies) == null ? void 0 : _b.filter((d) => d.dependency_type !== "blocks")) ?? [];
  return /* @__PURE__ */ jsxs("div", { className: "issue-detail", children: [
    /* @__PURE__ */ jsxs("div", { className: "detail-header", children: [
      /* @__PURE__ */ jsxs("div", { className: "detail-header-top", children: [
        /* @__PURE__ */ jsxs("div", { className: "detail-id-group", children: [
          /* @__PURE__ */ jsx("span", { className: "detail-id", children: issue.id }),
          /* @__PURE__ */ jsx(CopyIdButton, { id: issue.id })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "detail-actions-top", children: [
          onEdit && /* @__PURE__ */ jsx("button", { className: "btn btn-secondary", onClick: () => onEdit(issue), children: "Edit" }),
          /* @__PURE__ */ jsx("button", { className: "btn btn-secondary detail-close-btn", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 14 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "detail-title", children: issue.title })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "detail-meta", children: [
      /* @__PURE__ */ jsxs("span", { className: `badge badge-${issue.status}`, children: [
        /* @__PURE__ */ jsx(StatusIcon, { status: issue.status, size: 12 }),
        (_c = issue.status) == null ? void 0 : _c.replace("_", " ")
      ] }),
      issue.priority !== void 0 && /* @__PURE__ */ jsx("span", { className: `priority-badge p${issue.priority}`, children: PRIORITY_LABEL$2[issue.priority] }),
      issue.issue_type && /* @__PURE__ */ jsx("span", { className: "detail-type", children: issue.issue_type }),
      issue.assignee && /* @__PURE__ */ jsxs("span", { className: "detail-assignee", children: [
        /* @__PURE__ */ jsx(User, { size: 12, strokeWidth: 1.75 }),
        " ",
        issue.assignee
      ] }),
      issue.created_at && /* @__PURE__ */ jsxs("span", { className: "detail-date", children: [
        "Created ",
        formatDate(issue.created_at)
      ] })
    ] }),
    canClose && /* @__PURE__ */ jsxs("div", { className: "detail-section detail-actions-bottom", children: [
      /* @__PURE__ */ jsxs("div", { className: "detail-btn-row", children: [
        canClaim && /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-secondary",
            disabled: actionPending,
            onClick: () => handleAction(() => updateIssue(issueId, { claim: true }), "Issue claimed"),
            children: "Claim"
          }
        ),
        canInProgress && /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-secondary",
            disabled: actionPending,
            onClick: () => handleAction(() => updateIssue(issueId, { status: "in_progress" }), "Marked in progress"),
            children: "Mark In Progress"
          }
        ),
        canBlock && /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-secondary",
            disabled: actionPending,
            onClick: () => handleAction(() => updateIssue(issueId, { status: "blocked" }), "Marked blocked"),
            children: "Mark Blocked"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-danger",
            disabled: actionPending,
            onClick: handleClose,
            children: closing ? "Confirm Close" : "Close Issue"
          }
        )
      ] }),
      closing && /* @__PURE__ */ jsxs("div", { className: "close-reason-row", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            autoFocus: true,
            className: "close-reason-input",
            placeholder: "Reason (optional)",
            value: closeReason,
            onChange: (e) => setCloseReason(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") handleClose();
              if (e.key === "Escape") setClosing(false);
            }
          }
        ),
        /* @__PURE__ */ jsx("button", { className: "btn btn-secondary", onClick: () => setClosing(false), children: "Cancel" })
      ] })
    ] }),
    issue.description && /* @__PURE__ */ jsxs("div", { className: "detail-section", children: [
      /* @__PURE__ */ jsx("div", { className: "detail-section-label", children: "Description" }),
      /* @__PURE__ */ jsx("div", { className: "detail-description", children: issue.description })
    ] }),
    issue.notes && /* @__PURE__ */ jsxs("div", { className: "detail-section", children: [
      /* @__PURE__ */ jsx("div", { className: "detail-section-label", children: "Notes" }),
      /* @__PURE__ */ jsx("div", { className: "detail-description", children: issue.notes })
    ] }),
    issue.design && /* @__PURE__ */ jsxs("div", { className: "detail-section", children: [
      /* @__PURE__ */ jsx("div", { className: "detail-section-label", children: "Design" }),
      /* @__PURE__ */ jsx("div", { className: "detail-description", children: issue.design })
    ] }),
    (blockedBy.length > 0 || blocking.length > 0) && /* @__PURE__ */ jsxs("div", { className: "detail-section", children: [
      /* @__PURE__ */ jsx("div", { className: "detail-section-label", children: "Dependencies" }),
      blockedBy.length > 0 && /* @__PURE__ */ jsxs("div", { className: "dep-group", children: [
        /* @__PURE__ */ jsx("span", { className: "dep-group-label", children: "Blocked by" }),
        /* @__PURE__ */ jsx("div", { className: "dep-chips", children: blockedBy.map((d) => /* @__PURE__ */ jsx(DepChip, { dep: d, onSelect: onSelectIssue ?? (() => {
        }) }, d.id)) })
      ] }),
      blocking.length > 0 && /* @__PURE__ */ jsxs("div", { className: "dep-group", children: [
        /* @__PURE__ */ jsx("span", { className: "dep-group-label", children: "Blocking" }),
        /* @__PURE__ */ jsx("div", { className: "dep-chips", children: blocking.map((d) => /* @__PURE__ */ jsx(DepChip, { dep: d, onSelect: onSelectIssue ?? (() => {
        }) }, d.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(CommentThread, { issueId })
  ] });
}
const TYPES = ["task", "bug", "feature", "chore", "epic", "decision", "spike", "story", "milestone"];
const PRIORITIES = [
  { value: 0, label: "P0", cls: "p0" },
  { value: 1, label: "P1", cls: "p1" },
  { value: 2, label: "P2", cls: "p2" },
  { value: 3, label: "P3", cls: "p3" },
  { value: 4, label: "P4", cls: "p4" }
];
function IssueModal({ issue, onClose, onSaved }) {
  const isEdit = !!issue;
  const titleRef = useRef(null);
  const [form, setForm] = useState({
    title: (issue == null ? void 0 : issue.title) ?? "",
    description: (issue == null ? void 0 : issue.description) ?? "",
    type: (issue == null ? void 0 : issue.issue_type) ?? "task",
    priority: (issue == null ? void 0 : issue.priority) ?? 2,
    assignee: (issue == null ? void 0 : issue.assignee) ?? ""
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    var _a;
    (_a = titleRef.current) == null ? void 0 : _a.focus();
  }, []);
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = {
        title: form.title.trim(),
        description: form.description.trim() || void 0,
        type: form.type,
        priority: form.priority,
        assignee: form.assignee.trim() || void 0
      };
      const saved = isEdit ? await updateIssue(issue.id, data) : await createIssue(data);
      toast(isEdit ? "Issue updated" : "Issue created", "success");
      onSaved == null ? void 0 : onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message);
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "modal-backdrop", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: /* @__PURE__ */ jsxs("div", { className: "modal", role: "dialog", "aria-modal": "true", children: [
    /* @__PURE__ */ jsxs("div", { className: "modal-header", children: [
      /* @__PURE__ */ jsx("h3", { className: "modal-title", children: isEdit ? "Edit Issue" : "New Issue" }),
      /* @__PURE__ */ jsx("button", { className: "btn btn-secondary modal-close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { className: "modal-body", onSubmit: handleSubmit, children: [
      error && /* @__PURE__ */ jsx("div", { className: "modal-error", children: error }),
      /* @__PURE__ */ jsxs("label", { className: "field", children: [
        /* @__PURE__ */ jsxs("span", { className: "field-label", children: [
          "Title ",
          /* @__PURE__ */ jsx("span", { className: "required", children: "*" })
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: titleRef,
            className: "field-input",
            placeholder: "Short summary",
            value: form.title,
            onChange: (e) => set("title", e.target.value),
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "field", children: [
        /* @__PURE__ */ jsx("span", { className: "field-label", children: "Description" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "field-input",
            rows: 6,
            placeholder: "Why this issue exists and what needs to be done",
            value: form.description,
            onChange: (e) => set("description", e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "field-row", children: [
        /* @__PURE__ */ jsxs("label", { className: "field field-half", children: [
          /* @__PURE__ */ jsx("span", { className: "field-label", children: "Type" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              className: "field-input",
              value: form.type,
              onChange: (e) => set("type", e.target.value),
              children: TYPES.map((t) => /* @__PURE__ */ jsx("option", { value: t, children: t }, t))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "field field-half", children: [
          /* @__PURE__ */ jsx("span", { className: "field-label", children: "Assignee" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "field-input",
              placeholder: "Username",
              value: form.assignee,
              onChange: (e) => set("assignee", e.target.value)
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "field", children: [
        /* @__PURE__ */ jsx("span", { className: "field-label", children: "Priority" }),
        /* @__PURE__ */ jsx("div", { className: "priority-segmented", children: PRIORITIES.map((p) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: `priority-seg-btn ${p.cls} ${form.priority === p.value ? "active" : ""}`,
            onClick: () => set("priority", p.value),
            children: p.label
          },
          p.value
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "modal-footer", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "btn btn-secondary", onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "btn btn-primary", disabled: saving, children: saving ? "Saving…" : isEdit ? "Save" : "Create" })
      ] })
    ] })
  ] }) });
}
function ErrorScreen({ error }) {
  const isBdMissing = (error == null ? void 0 : error.includes("BD_NOT_FOUND")) || (error == null ? void 0 : error.includes("not found in PATH"));
  const isNoBeads = (error == null ? void 0 : error.includes("BD_NO_BEADS_DIR")) || (error == null ? void 0 : error.includes(".beads/"));
  return /* @__PURE__ */ jsx("div", { className: "error-screen", children: /* @__PURE__ */ jsxs("div", { className: "error-screen-box", children: [
    /* @__PURE__ */ jsx("div", { className: "error-screen-icon", children: "⚠" }),
    /* @__PURE__ */ jsx("h2", { className: "error-screen-title", children: "Cannot connect to beads" }),
    isBdMissing && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { className: "error-screen-msg", children: [
        /* @__PURE__ */ jsx("code", { children: "bd" }),
        " was not found in your PATH."
      ] }),
      /* @__PURE__ */ jsx("p", { className: "error-screen-hint", children: "Install beads first, then restart beadee." })
    ] }),
    isNoBeads && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { className: "error-screen-msg", children: [
        "No ",
        /* @__PURE__ */ jsx("code", { children: ".beads/" }),
        " directory found in the current directory."
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "error-screen-hint", children: [
        "Run ",
        /* @__PURE__ */ jsx("code", { children: "beadee" }),
        " from a directory that contains a beads project."
      ] })
    ] }),
    !isBdMissing && !isNoBeads && /* @__PURE__ */ jsx("p", { className: "error-screen-msg", children: error }),
    /* @__PURE__ */ jsx("button", { className: "btn btn-primary", onClick: () => window.location.reload(), children: "Retry" })
  ] }) });
}
function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return /* @__PURE__ */ jsx("div", { className: "toast-container", children: toasts.map((t) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: `toast toast-${t.type}`,
      onClick: () => onDismiss(t.id),
      children: [
        t.type === "success" ? /* @__PURE__ */ jsx(CircleCheck, { size: 14, strokeWidth: 2 }) : /* @__PURE__ */ jsx(CircleX, { size: 14, strokeWidth: 2 }),
        t.message
      ]
    },
    t.id
  )) });
}
const SHORTCUTS = [
  {
    group: "Global",
    items: [
      { key: "n", desc: "New issue" },
      { key: "/", desc: "Focus search" },
      { key: "r", desc: "Refresh" },
      { key: "1", desc: "List view" },
      { key: "2", desc: "Board view" },
      { key: "s", desc: "Settings" },
      { key: "?", desc: "Show this help" },
      { key: "Esc", desc: "Close / deselect" }
    ]
  },
  {
    group: "List View",
    items: [
      { key: "j", desc: "Next issue" },
      { key: "k", desc: "Previous issue" },
      { key: "Enter", desc: "Open selected" }
    ]
  },
  {
    group: "Issue Detail",
    items: [
      { key: "c", desc: "Claim issue" },
      { key: "e", desc: "Edit issue" },
      { key: "x", desc: "Close issue" }
    ]
  }
];
function ShortcutsHelp({ onClose }) {
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape" || e.key === "?") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return /* @__PURE__ */ jsx("div", { className: "modal-backdrop", onMouseDown: (e) => e.target === e.currentTarget && onClose(), children: /* @__PURE__ */ jsxs("div", { className: "modal shortcuts-modal", children: [
    /* @__PURE__ */ jsxs("div", { className: "modal-header", children: [
      /* @__PURE__ */ jsx("h3", { className: "modal-title", children: "Keyboard Shortcuts" }),
      /* @__PURE__ */ jsx("button", { className: "btn btn-secondary modal-close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "shortcuts-body", children: SHORTCUTS.map((group) => /* @__PURE__ */ jsxs("div", { className: "shortcuts-group", children: [
      /* @__PURE__ */ jsx("div", { className: "shortcuts-group-label", children: group.group }),
      group.items.map((item) => /* @__PURE__ */ jsxs("div", { className: "shortcut-row", children: [
        /* @__PURE__ */ jsx("kbd", { className: "kbd", children: item.key }),
        /* @__PURE__ */ jsx("span", { className: "shortcut-desc", children: item.desc })
      ] }, item.key))
    ] }, group.group)) })
  ] }) });
}
function Footer({ onShowShortcuts }) {
  return /* @__PURE__ */ jsxs("footer", { className: "app-footer", children: [
    /* @__PURE__ */ jsx("span", { className: "footer-version", children: "beadee v0.1.0" }),
    /* @__PURE__ */ jsxs("button", { className: "footer-shortcuts-btn", onClick: onShowShortcuts, title: "Keyboard shortcuts (?)", children: [
      /* @__PURE__ */ jsx("kbd", { className: "kbd kbd-small", children: "?" }),
      " shortcuts"
    ] })
  ] });
}
const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Closed", value: "closed" }
];
const TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature" },
  { label: "Task", value: "task" },
  { label: "Chore", value: "chore" },
  { label: "Epic", value: "epic" },
  { label: "Spike", value: "spike" },
  { label: "Story", value: "story" }
];
const TYPE_SHORT$1 = {
  bug: "BUG",
  feature: "FEAT",
  task: "TASK",
  chore: "CHR",
  epic: "EPIC",
  spike: "SPK",
  story: "STR",
  decision: "DEC",
  milestone: "MS"
};
const PRIORITY_LABEL$1 = { 0: "P0", 1: "P1", 2: "P2", 3: "P3", 4: "P4" };
function IssueRow({ issue, selected, onClick }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      className: `issue-row ${selected ? "selected" : ""} status-${issue.status}`,
      onClick,
      children: [
        /* @__PURE__ */ jsx(StatusIcon, { status: issue.status }),
        /* @__PURE__ */ jsxs("span", { className: "issue-row-body", children: [
          /* @__PURE__ */ jsx("span", { className: "issue-row-title", children: issue.title }),
          /* @__PURE__ */ jsxs("span", { className: "issue-row-meta", children: [
            /* @__PURE__ */ jsx("span", { className: "issue-row-id", children: issue.id }),
            issue.issue_type && /* @__PURE__ */ jsx("span", { className: `badge-type type-${issue.issue_type}`, children: TYPE_SHORT$1[issue.issue_type] ?? issue.issue_type.toUpperCase() })
          ] })
        ] }),
        /* @__PURE__ */ jsx("span", { className: `priority-badge p${issue.priority ?? 2}`, children: PRIORITY_LABEL$1[issue.priority] ?? "P2" })
      ]
    }
  );
}
function SkeletonRow() {
  return /* @__PURE__ */ jsxs("div", { className: "issue-row skeleton-row", children: [
    /* @__PURE__ */ jsx("span", { className: "skeleton skeleton-icon" }),
    /* @__PURE__ */ jsxs("span", { className: "issue-row-body", children: [
      /* @__PURE__ */ jsx("span", { className: "skeleton skeleton-title" }),
      /* @__PURE__ */ jsx("span", { className: "skeleton skeleton-meta" })
    ] }),
    /* @__PURE__ */ jsx("span", { className: "skeleton skeleton-badge" })
  ] });
}
function ListView({ search, selectedIssueId, onSelectIssue, DetailPanel, onRefreshed }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const { issues, loading, error } = useIssues({
    status: statusFilter,
    type: typeFilter,
    search
  }, { onRefreshed });
  const selectedIdx = useMemo(
    () => issues.findIndex((i) => i.id === selectedIssueId),
    [issues, selectedIssueId]
  );
  const navigate = useCallback((dir) => {
    if (!issues.length) return;
    const next = selectedIdx === -1 ? dir > 0 ? 0 : issues.length - 1 : Math.max(0, Math.min(issues.length - 1, selectedIdx + dir));
    onSelectIssue(issues[next].id);
  }, [issues, selectedIdx, onSelectIssue]);
  useKeyboard({
    j: () => navigate(1),
    k: () => navigate(-1),
    Enter: () => {
      if (selectedIdx !== -1) onSelectIssue(issues[selectedIdx].id);
    }
  });
  return /* @__PURE__ */ jsxs("div", { className: "list-view", children: [
    /* @__PURE__ */ jsxs("div", { className: "list-panel", children: [
      /* @__PURE__ */ jsxs("div", { className: "list-panel-toolbar", children: [
        /* @__PURE__ */ jsx("div", { className: "status-pills", children: STATUS_FILTERS.map((f) => /* @__PURE__ */ jsx(
          "button",
          {
            className: `pill ${statusFilter === f.value ? "active" : ""}`,
            onClick: () => setStatusFilter(f.value),
            children: f.label
          },
          f.value
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "list-panel-footer-row", children: [
          /* @__PURE__ */ jsx(
            "select",
            {
              className: "type-select",
              value: typeFilter,
              onChange: (e) => setTypeFilter(e.target.value),
              children: TYPE_OPTIONS.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value))
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "issue-count", children: loading ? "…" : `${issues.length} issue${issues.length !== 1 ? "s" : ""}` })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "issue-list", children: [
        loading && [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsx(SkeletonRow, {}, i)),
        error && /* @__PURE__ */ jsxs("div", { className: "list-state list-error", children: [
          "Error: ",
          error
        ] }),
        !loading && !error && issues.length === 0 && /* @__PURE__ */ jsx("div", { className: "list-state list-empty", children: search || statusFilter || typeFilter ? "No issues match your filters" : "No issues yet" }),
        issues.map((issue) => /* @__PURE__ */ jsx(
          IssueRow,
          {
            issue,
            selected: issue.id === selectedIssueId,
            onClick: () => onSelectIssue(issue.id === selectedIssueId ? null : issue.id)
          },
          issue.id
        ))
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "detail-panel", children: selectedIssueId ? /* @__PURE__ */ jsx(DetailPanel, { issueId: selectedIssueId, onClose: () => onSelectIssue(null) }) : /* @__PURE__ */ jsxs("div", { className: "detail-empty", children: [
      /* @__PURE__ */ jsx(Inbox, { size: 32, className: "detail-empty-icon", strokeWidth: 1.25 }),
      /* @__PURE__ */ jsx("p", { children: "Select an issue to view details" })
    ] }) })
  ] });
}
const PRIORITY_LABEL = { 0: "P0", 1: "P1", 2: "P2", 3: "P3", 4: "P4" };
const TYPE_SHORT = {
  bug: "BUG",
  feature: "FEAT",
  task: "TASK",
  chore: "CHR",
  epic: "EPIC",
  spike: "SPK",
  story: "STR",
  decision: "DEC",
  milestone: "MS"
};
function initials(name) {
  if (!name) return "?";
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function IssueCard({ issue, selected, onClick }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      className: `issue-card ${selected ? "selected" : ""}`,
      onClick,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "issue-card-top", children: [
          /* @__PURE__ */ jsx("span", { className: `priority-badge p${issue.priority ?? 2}`, children: PRIORITY_LABEL[issue.priority] ?? "P2" }),
          issue.issue_type && /* @__PURE__ */ jsx("span", { className: `badge-type type-${issue.issue_type}`, children: TYPE_SHORT[issue.issue_type] ?? issue.issue_type.toUpperCase() }),
          issue.assignee && /* @__PURE__ */ jsx("span", { className: "card-avatar", title: issue.assignee, children: initials(issue.assignee) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "issue-card-title", children: issue.title }),
        /* @__PURE__ */ jsx("div", { className: "issue-card-id", children: issue.id })
      ]
    }
  );
}
const COLUMNS = [
  { id: "open", label: "Open", status: "open" },
  { id: "in_progress", label: "In Progress", status: "in_progress" },
  { id: "blocked", label: "Blocked", status: "blocked" },
  { id: "done", label: "Done", status: "closed" }
];
function KanbanColumn({ column, issues, selectedIssueId, onSelectIssue }) {
  return /* @__PURE__ */ jsxs("div", { className: `kanban-col kanban-col-${column.id}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "kanban-col-header", children: [
      /* @__PURE__ */ jsx("span", { className: "kanban-col-label", children: column.label }),
      /* @__PURE__ */ jsx("span", { className: "kanban-col-count", children: issues.length })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "kanban-col-body", children: [
      issues.length === 0 && /* @__PURE__ */ jsx("div", { className: "kanban-empty", children: "No issues" }),
      issues.map((issue) => /* @__PURE__ */ jsx(
        IssueCard,
        {
          issue,
          selected: issue.id === selectedIssueId,
          onClick: () => onSelectIssue(issue.id === selectedIssueId ? null : issue.id)
        },
        issue.id
      ))
    ] })
  ] });
}
function KanbanView({ search, selectedIssueId, onSelectIssue, DetailPanel, onRefreshed }) {
  const { issues, loading, error } = useIssues({ search }, { onRefreshed });
  const byStatus = {};
  for (const col of COLUMNS) byStatus[col.status] = [];
  for (const issue of issues) {
    if (byStatus[issue.status]) byStatus[issue.status].push(issue);
  }
  return /* @__PURE__ */ jsxs("div", { className: "kanban-view", children: [
    /* @__PURE__ */ jsxs("div", { className: "kanban-board", children: [
      loading && /* @__PURE__ */ jsx("div", { className: "kanban-state", children: "Loading…" }),
      error && /* @__PURE__ */ jsxs("div", { className: "kanban-state kanban-error", children: [
        "Error: ",
        error
      ] }),
      !loading && !error && COLUMNS.map((col) => /* @__PURE__ */ jsx(
        KanbanColumn,
        {
          column: col,
          issues: byStatus[col.status],
          selectedIssueId,
          onSelectIssue
        },
        col.id
      ))
    ] }),
    selectedIssueId && /* @__PURE__ */ jsx("div", { className: "kanban-detail", children: /* @__PURE__ */ jsx(
      DetailPanel,
      {
        issueId: selectedIssueId,
        onClose: () => onSelectIssue(null)
      }
    ) })
  ] });
}
const THEMES = [
  { id: "dark", label: "Dark", swatch: "#0d1117", desc: "GitHub-style dark" },
  { id: "light", label: "Light", swatch: "#ffffff", desc: "Clean light mode" },
  { id: "dracula", label: "Dracula", swatch: "#282a36", desc: "Classic purple & cyan" },
  { id: "synthwave", label: "Synthwave", swatch: "#1a1033", desc: "Deep purple & neon pink" },
  { id: "hacker", label: "Hacker", swatch: "#000000", desc: "Green on black, monospace" },
  { id: "auto", label: "Auto", swatch: null, desc: "Follow OS preference" }
];
function SettingsView({ theme, onThemeChange }) {
  return /* @__PURE__ */ jsx("div", { className: "settings-view", children: /* @__PURE__ */ jsxs("div", { className: "settings-content", children: [
    /* @__PURE__ */ jsx("h2", { className: "settings-title", children: "Settings" }),
    /* @__PURE__ */ jsxs("section", { className: "settings-section", children: [
      /* @__PURE__ */ jsx("h3", { className: "settings-section-title", children: "Appearance" }),
      /* @__PURE__ */ jsx("p", { className: "settings-section-desc", children: "Choose a color theme for the interface." }),
      /* @__PURE__ */ jsx("div", { className: "theme-grid", children: THEMES.map((t) => /* @__PURE__ */ jsxs(
        "button",
        {
          className: `theme-card ${t.id === theme ? "active" : ""}`,
          onClick: () => onThemeChange(t.id),
          children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "theme-card-swatch",
                style: t.swatch ? { background: t.swatch } : { background: "linear-gradient(135deg, #0d1117 50%, #ffffff 50%)" }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "theme-card-label", children: t.label }),
            /* @__PURE__ */ jsx("span", { className: "theme-card-desc", children: t.desc }),
            t.id === theme && /* @__PURE__ */ jsx(Check, { size: 14, strokeWidth: 2.5, className: "theme-card-check" })
          ]
        },
        t.id
      )) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "settings-section", children: [
      /* @__PURE__ */ jsx("h3", { className: "settings-section-title", children: "More settings coming soon" }),
      /* @__PURE__ */ jsx("p", { className: "settings-section-desc", children: "Future options may include default filters, polling interval, and display density." })
    ] })
  ] }) });
}
function setTheme(theme) {
  localStorage.setItem("beadee-theme", theme);
  if (theme === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
  } else {
    document.documentElement.dataset.theme = theme;
  }
}
function App() {
  const [theme, setThemeState] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("beadee-theme") : null) || "dark"
  );
  const [activeTab, setActiveTab] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("beadee-tab") : null) || "list"
  );
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [detailKey, setDetailKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [polling, setPolling] = useState(false);
  useRef(null);
  const { error: healthError } = useHealth();
  const { toasts, dismiss } = useToastProvider();
  const handleRefresh = useCallback(() => setDetailKey((k) => k + 1), []);
  const handleRefreshed = useCallback((date) => {
    setLastUpdated(date);
    setPolling(false);
  }, []);
  function switchTab(tab) {
    setActiveTab(tab);
    setSelectedIssueId(null);
    localStorage.setItem("beadee-tab", tab);
  }
  function handleThemeChange(t) {
    setThemeState(t);
    setTheme(t);
  }
  function openEdit(issue) {
    setEditingIssue(issue);
    setShowModal(true);
  }
  function handleModalSaved() {
    handleRefresh();
    setShowModal(false);
    setEditingIssue(null);
  }
  const modalOpen = showModal || showShortcuts;
  useKeyboard({
    "n": () => {
      setEditingIssue(null);
      setShowModal(true);
    },
    "/": () => {
      const el = document.querySelector(".header-search");
      el == null ? void 0 : el.focus();
    },
    "r": () => handleRefresh(),
    "1": () => switchTab("list"),
    "2": () => switchTab("kanban"),
    "?": () => setShowShortcuts(true),
    "s": () => switchTab("settings"),
    "Escape": () => {
      if (activeTab === "settings") switchTab("list");
      else if (selectedIssueId) setSelectedIssueId(null);
    }
  }, !modalOpen);
  const DetailPanel = useCallback(({ issueId, onClose }) => /* @__PURE__ */ jsx(
    IssueDetail,
    {
      issueId,
      onClose,
      onSelectIssue: setSelectedIssueId,
      onEdit: openEdit,
      onRefresh: handleRefresh
    },
    `${issueId}-${detailKey}`
  ), [detailKey]);
  if (healthError) return /* @__PURE__ */ jsx(ErrorScreen, { error: healthError });
  return /* @__PURE__ */ jsxs("div", { className: "app", children: [
    /* @__PURE__ */ jsx(
      Header,
      {
        activeTab,
        onTabChange: switchTab,
        search,
        onSearchChange: setSearch,
        onNewIssue: () => {
          setEditingIssue(null);
          setShowModal(true);
        },
        lastUpdated,
        polling
      }
    ),
    /* @__PURE__ */ jsxs("main", { className: "main", children: [
      activeTab === "list" && /* @__PURE__ */ jsx(
        ListView,
        {
          search,
          selectedIssueId,
          onSelectIssue: setSelectedIssueId,
          DetailPanel,
          onRefreshed: handleRefreshed
        }
      ),
      activeTab === "kanban" && /* @__PURE__ */ jsx(
        KanbanView,
        {
          search,
          selectedIssueId,
          onSelectIssue: setSelectedIssueId,
          DetailPanel,
          onRefreshed: handleRefreshed
        }
      ),
      activeTab === "settings" && /* @__PURE__ */ jsx(SettingsView, { theme, onThemeChange: handleThemeChange })
    ] }),
    /* @__PURE__ */ jsx(Footer, { onShowShortcuts: () => setShowShortcuts(true) }),
    showModal && /* @__PURE__ */ jsx(
      IssueModal,
      {
        issue: editingIssue,
        onClose: () => {
          setShowModal(false);
          setEditingIssue(null);
        },
        onSaved: handleModalSaved
      }
    ),
    showShortcuts && /* @__PURE__ */ jsx(ShortcutsHelp, { onClose: () => setShowShortcuts(false) }),
    /* @__PURE__ */ jsx(ToastContainer, { toasts, onDismiss: dismiss })
  ] });
}
const _index = UNSAFE_withComponentProps(function Index() {
  return /* @__PURE__ */ jsx(App, {});
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _index
}, Symbol.toStringTag, { value: "Module" }));
const controllers = /* @__PURE__ */ new Set();
const encoder$1 = new TextEncoder();
let debounceTimer = null;
let suppressWatchUntil = 0;
let watcherStarted = false;
function suppressWatch() {
  suppressWatchUntil = Date.now() + 2e3;
}
function broadcast() {
  for (const ctrl of controllers) {
    try {
      ctrl.enqueue(encoder$1.encode('data: {"type":"change"}\n\n'));
    } catch {
      controllers.delete(ctrl);
    }
  }
}
function addController(ctrl) {
  controllers.add(ctrl);
  ensureWatcher();
}
function removeController(ctrl) {
  controllers.delete(ctrl);
}
function ensureWatcher() {
  if (watcherStarted) return;
  watcherStarted = true;
  const beadsDir = join(process.cwd(), ".beads");
  try {
    const watcher = watch(beadsDir, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      if (filename.includes("lock") || filename.endsWith(".log")) return;
      if (Date.now() < suppressWatchUntil) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(broadcast, 200);
    });
    watcher.on("error", () => {
    });
  } catch {
  }
}
const encoder = new TextEncoder();
async function loader$6({
  request
}) {
  let ctrl;
  const stream = new ReadableStream({
    start(c) {
      ctrl = c;
      c.enqueue(encoder.encode(": connected\n\n"));
      addController(c);
      const keepalive = setInterval(() => {
        try {
          c.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          removeController(c);
          clearInterval(keepalive);
        }
      }, 3e4);
      request.signal.addEventListener("abort", () => {
        removeController(c);
        clearInterval(keepalive);
      });
    },
    cancel() {
      if (ctrl) removeController(ctrl);
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const execFileAsync = promisify(execFile);
const BD_LOCK_RETRIES = 4;
const BD_LOCK_RETRY_BASE_MS = 80;
function isLockError(err) {
  const msg = (err.stderr || err.message || "").toLowerCase();
  return msg.includes("failed to open database") || msg.includes("database is locked");
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function bdRun(args, cwd) {
  let lastErr;
  for (let attempt = 0; attempt <= BD_LOCK_RETRIES; attempt++) {
    if (attempt > 0) await sleep(BD_LOCK_RETRY_BASE_MS * 2 ** (attempt - 1));
    let stdout;
    try {
      ;
      ({ stdout } = await execFileAsync("bd", ["--json", ...args], { cwd }));
    } catch (err) {
      if (err.code === "ENOENT") {
        throw Object.assign(new Error("bd not found in PATH"), { code: "BD_NOT_FOUND" });
      }
      if (isLockError(err) && attempt < BD_LOCK_RETRIES) {
        lastErr = err;
        continue;
      }
      const message2 = (err.stderr || err.message || "").trim();
      throw Object.assign(new Error(`bd error: ${message2}`), {
        code: "BD_ERROR",
        exitCode: err.code,
        stderr: err.stderr
      });
    }
    const text = stdout.trim();
    if (!text) return [];
    try {
      return JSON.parse(text);
    } catch {
      throw Object.assign(new Error(`bd returned non-JSON output: ${text.slice(0, 200)}`), {
        code: "BD_PARSE_ERROR"
      });
    }
  }
  const message = (lastErr.stderr || lastErr.message || "").trim();
  throw Object.assign(new Error(`bd error (lock contention after ${BD_LOCK_RETRIES} retries): ${message}`), {
    code: "BD_ERROR",
    exitCode: lastErr.code,
    stderr: lastErr.stderr
  });
}
async function bdVersion() {
  try {
    const { stdout } = await execFileAsync("bd", ["version"]);
    return stdout.trim();
  } catch {
    return "unknown";
  }
}
async function bdCheck(cwd) {
  let bdPath;
  try {
    ;
    ({ stdout: bdPath } = await execFileAsync("which", ["bd"]));
    bdPath = bdPath.trim();
  } catch {
    throw Object.assign(new Error("bd not found in PATH"), { code: "BD_NOT_FOUND" });
  }
  const beadsDir = join(cwd, ".beads");
  try {
    await access(beadsDir);
  } catch {
    throw Object.assign(
      new Error(`.beads/ not found in ${cwd} — is this a beads project?`),
      { code: "BD_NO_BEADS_DIR", cwd }
    );
  }
  return { bd: bdPath, beads: true };
}
async function loader$5() {
  const cwd = process.cwd();
  const [{
    bd
  }, version] = await Promise.all([bdCheck(cwd), bdVersion()]);
  return Response.json({
    ok: true,
    projectName: basename$1(cwd),
    bdVersion: version,
    cwd,
    bd
  });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function loader$4({
  request
}) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const search = url.searchParams.get("search");
  const cwd = process.cwd();
  suppressWatch();
  const issues = await bdRun(["list", "--all"], cwd);
  let result = issues;
  if (status) result = result.filter((i) => i.status === status);
  if (type) result = result.filter((i) => i.issue_type === type);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter((i) => {
      var _a, _b, _c;
      return ((_a = i.title) == null ? void 0 : _a.toLowerCase().includes(q)) || ((_b = i.description) == null ? void 0 : _b.toLowerCase().includes(q)) || ((_c = i.id) == null ? void 0 : _c.toLowerCase().includes(q));
    });
  }
  return Response.json(result);
}
async function action$4({
  request
}) {
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const body = await request.json().catch(() => ({}));
  const {
    title,
    description,
    type = "task",
    priority = 2
  } = body;
  if (!title) return Response.json({
    error: "title is required"
  }, {
    status: 400
  });
  const args = ["create", `--title=${title}`, `--type=${type}`, `--priority=${priority}`];
  if (description) args.push(`--description=${description}`);
  const result = await bdRun(args, process.cwd());
  suppressWatch();
  broadcast();
  return Response.json(Array.isArray(result) ? result[0] : result);
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3({
  params
}) {
  const {
    id
  } = params;
  suppressWatch();
  const result = await bdRun(["show", id, "--long"], process.cwd());
  const issue = Array.isArray(result) ? result[0] : result;
  if (!issue) return Response.json({
    error: `Issue ${id} not found`
  }, {
    status: 404
  });
  return Response.json(issue);
}
async function action$3({
  request,
  params
}) {
  if (request.method !== "PATCH") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const {
    id
  } = params;
  const body = await request.json().catch(() => ({}));
  if (Object.keys(body).length === 0) {
    return Response.json({
      error: "No fields to update"
    }, {
      status: 400
    });
  }
  const args = ["update", id];
  if (body.claim) {
    args.push("--claim");
  } else {
    if (body.title) args.push(`--title=${body.title}`);
    if (body.description) args.push(`--description=${body.description}`);
    if (body.status) args.push(`--status=${body.status}`);
    if (body.assignee) args.push(`--assignee=${body.assignee}`);
    if (body.priority !== void 0) args.push(`--priority=${body.priority}`);
  }
  const result = await bdRun(args, process.cwd());
  suppressWatch();
  broadcast();
  return Response.json(Array.isArray(result) ? result[0] : result);
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function action$2({
  request,
  params
}) {
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const {
    id
  } = params;
  const body = await request.json().catch(() => ({}));
  const args = ["close", id];
  if (body.reason) args.push(`--reason=${body.reason}`);
  const result = await bdRun(args, process.cwd());
  suppressWatch();
  broadcast();
  return Response.json(Array.isArray(result) ? result[0] : result ?? {
    ok: true
  });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({
  params
}) {
  const {
    id
  } = params;
  suppressWatch();
  const result = await bdRun(["comments", id], process.cwd());
  return Response.json(Array.isArray(result) ? result : []);
}
async function action$1({
  request,
  params
}) {
  var _a;
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  const {
    id
  } = params;
  const body = await request.json().catch(() => ({}));
  const text = (_a = body.text) == null ? void 0 : _a.trim();
  if (!text) return Response.json({
    error: "text is required"
  }, {
    status: 400
  });
  const result = await bdRun(["comment", id, text], process.cwd());
  suppressWatch();
  broadcast();
  return Response.json(Array.isArray(result) ? result[result.length - 1] : result);
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function action({
  request
}) {
  const body = await request.json().catch(() => ({}));
  const {
    issue,
    dependsOn
  } = body;
  if (!issue || !dependsOn) {
    return Response.json({
      error: "issue and dependsOn are required"
    }, {
      status: 400
    });
  }
  if (request.method === "POST") {
    await bdRun(["dep", "add", issue, dependsOn], process.cwd());
  } else if (request.method === "DELETE") {
    await bdRun(["dep", "remove", issue, dependsOn], process.cwd());
  } else {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  suppressWatch();
  broadcast();
  return Response.json({
    ok: true
  });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1() {
  suppressWatch();
  const result = await bdRun(["ready"], process.cwd());
  return Response.json(result);
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function loader() {
  suppressWatch();
  const result = await bdRun(["status"], process.cwd());
  return Response.json(result);
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BfLAA_cl.js", "imports": ["/assets/chunk-OE4NN4TA-CKpSLUnh.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-Bae1EUti.js", "imports": ["/assets/chunk-OE4NN4TA-CKpSLUnh.js"], "css": ["/assets/root-CcHmQgPz.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/_index-CBa14WHL.js", "imports": ["/assets/chunk-OE4NN4TA-CKpSLUnh.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.events": { "id": "routes/api.events", "parentId": "root", "path": "api/events", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.events-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.health": { "id": "routes/api.health", "parentId": "root", "path": "api/health", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.health-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.issues": { "id": "routes/api.issues", "parentId": "root", "path": "api/issues", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.issues-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.issues.$id": { "id": "routes/api.issues.$id", "parentId": "root", "path": "api/issues/:id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.issues._id-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.issues.$id.close": { "id": "routes/api.issues.$id.close", "parentId": "root", "path": "api/issues/:id/close", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.issues._id.close-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.issues.$id.comments": { "id": "routes/api.issues.$id.comments", "parentId": "root", "path": "api/issues/:id/comments", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.issues._id.comments-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.deps": { "id": "routes/api.deps", "parentId": "root", "path": "api/deps", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.deps-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.ready": { "id": "routes/api.ready", "parentId": "root", "path": "api/ready", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.ready-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.stats": { "id": "routes/api.stats", "parentId": "root", "path": "api/stats", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.stats-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-85c2d19c.js", "version": "85c2d19c", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_passThroughRequests": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/api.events": {
    id: "routes/api.events",
    parentId: "root",
    path: "api/events",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/api.health": {
    id: "routes/api.health",
    parentId: "root",
    path: "api/health",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/api.issues": {
    id: "routes/api.issues",
    parentId: "root",
    path: "api/issues",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/api.issues.$id": {
    id: "routes/api.issues.$id",
    parentId: "root",
    path: "api/issues/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/api.issues.$id.close": {
    id: "routes/api.issues.$id.close",
    parentId: "root",
    path: "api/issues/:id/close",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/api.issues.$id.comments": {
    id: "routes/api.issues.$id.comments",
    parentId: "root",
    path: "api/issues/:id/comments",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/api.deps": {
    id: "routes/api.deps",
    parentId: "root",
    path: "api/deps",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/api.ready": {
    id: "routes/api.ready",
    parentId: "root",
    path: "api/ready",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/api.stats": {
    id: "routes/api.stats",
    parentId: "root",
    path: "api/stats",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
