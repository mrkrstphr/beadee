import { index, layout, route } from '@react-router/dev/routes';

export default [
  layout('routes/_layout.tsx', [
    index('routes/_index.tsx'),
    route('list/:id?', 'routes/list.tsx'),
    route('kanban', 'routes/kanban.tsx'),
    route('kanban/:id', 'routes/kanbanIssue.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('memories', 'routes/memories.tsx'),
  ]),

  route('api/events', 'routes/api/events.ts'),
  route('api/health', 'routes/api/health.ts'),
  route('api/issues', 'routes/api/issues.ts'),
  route('api/issues/:id', 'routes/api/issue.ts'),
  route('api/issues/:id/close', 'routes/api/issueClose.ts'),
  route('api/issues/:id/comments', 'routes/api/issueComments.ts'),
  route('api/issues/:id/children', 'routes/api/issueChildren.ts'),
  route('api/issues/:id/labels', 'routes/api/issueLabels.ts'),
  route('api/deps', 'routes/api/deps.ts'),
  route('api/labels', 'routes/api/labels.ts'),
  route('api/ready', 'routes/api/ready.ts'),
  route('api/stats', 'routes/api/stats.ts'),
  route('api/update', 'routes/api/update.ts'),
  route('api/memories', 'routes/api/memories.ts'),
  route('api/epic-status', 'routes/api/epic-status.ts'),
  route('api/prefs', 'routes/api/prefs.ts'),
  route('api/prefs/:key', 'routes/api/pref.ts'),
];
