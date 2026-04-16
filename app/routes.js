import { index, route } from '@react-router/dev/routes'

export default [
  index('routes/_index.jsx'),

  route('api/events',                  'routes/api.events.js'),
  route('api/health',                  'routes/api.health.js'),
  route('api/issues',                  'routes/api.issues.js'),
  route('api/issues/:id',              'routes/api.issues.$id.js'),
  route('api/issues/:id/close',        'routes/api.issues.$id.close.js'),
  route('api/issues/:id/comments',     'routes/api.issues.$id.comments.js'),
  route('api/issues/:id/labels',       'routes/api.issues.$id.labels.js'),
  route('api/deps',                    'routes/api.deps.js'),
  route('api/labels',                  'routes/api.labels.js'),
  route('api/ready',                   'routes/api.ready.js'),
  route('api/stats',                   'routes/api.stats.js'),
]
