import { bdRun } from '../../server/bd.js';
import { suppressWatch } from '../../server/sse.js';
import type { EpicStatus } from '../types.js';

export async function loader() {
  suppressWatch();
  const raw = await bdRun(['epic', 'status', '--json'], process.cwd());

  const statuses = (raw as unknown[]).map((item: unknown) => {
    const record = item as {
      epic: { id: string; title: string };
      total_children: number;
      closed_children: number;
      eligible_for_close: boolean;
    };
    return {
      epic_id: record.epic.id,
      title: record.epic.title,
      total_children: record.total_children,
      closed_children: record.closed_children,
      eligible_for_close: record.eligible_for_close,
    } satisfies EpicStatus;
  });

  return Response.json(statuses);
}
