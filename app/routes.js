import { index, route, layout } from '@react-router/dev/routes'

export default [
  layout('routes/_layout.jsx', [
    index('routes/_index.jsx'),
    route('list',       'routes/list.jsx'),
    route('list/:id',   'routes/list.$id.jsx'),
    route('kanban',     'routes/kanban.jsx'),
    route('kanban/:id', 'routes/kanban.$id.jsx'),
    route('settings',   'routes/settings.jsx'),
  ]),

  route('api/events',                  'routes/api.events.js'),
  route('api/health',                  'routes/api.health.js'),
  route('api/issues',                  'routes/api.issues.js'),
  route('api/issues/:id',              'routes/api.issues.$id.js'),
  route('api/issues/:id/close',        'routes/api.issues.$id.close.js'),
  route('api/issues/:id/comments',     'routes/api.issues.$id.comments.js'),
  route('api/issues/:id/children',     'routes/api.issues.$id.children.js'),
  route('api/issues/:id/labels',       'routes/api.issues.$id.labels.js'),
  route('api/deps',                    'routes/api.deps.js'),
  route('api/labels',                  'routes/api.labels.js'),
  route('api/ready',                   'routes/api.ready.js'),
  route('api/stats',                   'routes/api.stats.js'),
]
