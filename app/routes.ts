import { index, route, layout } from '@react-router/dev/routes';

export default [
  layout('routes/_layout.tsx', [
    index('routes/_index.tsx'),
    route('list', 'routes/list.tsx'),
    route('list/:id', 'routes/list.$id.tsx'),
    route('kanban', 'routes/kanban.tsx'),
    route('kanban/:id', 'routes/kanban.$id.tsx'),
    route('settings', 'routes/settings.tsx'),
    route('memories', 'routes/memories.tsx'),
  ]),

  route('api/events', 'routes/api.events.ts'),
  route('api/health', 'routes/api.health.ts'),
  route('api/issues', 'routes/api.issues.ts'),
  route('api/issues/:id', 'routes/api.issues.$id.ts'),
  route('api/issues/:id/close', 'routes/api.issues.$id.close.ts'),
  route('api/issues/:id/comments', 'routes/api.issues.$id.comments.ts'),
  route('api/issues/:id/children', 'routes/api.issues.$id.children.ts'),
  route('api/issues/:id/labels', 'routes/api.issues.$id.labels.ts'),
  route('api/deps', 'routes/api.deps.ts'),
  route('api/labels', 'routes/api.labels.ts'),
  route('api/ready', 'routes/api.ready.ts'),
  route('api/stats', 'routes/api.stats.ts'),
  route('api/update', 'routes/api.update.ts'),
  route('api/memories', 'routes/api.memories.ts'),
  route('api/epic-status', 'routes/api.epic-status.ts'),
];
