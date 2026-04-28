import { getPrefs } from '../../../server/local-db.js';

export function loader() {
  let prefs: Record<string, string> = {};
  try {
    prefs = getPrefs();
  } catch {
    // prefs db unavailable — return empty, client will use defaults
  }
  return Response.json(prefs);
}
