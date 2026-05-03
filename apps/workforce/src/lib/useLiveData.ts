/**
 * Live data hooks. Each hook polls the backend on a fixed interval and exposes
 * `{ data, loading, error, refresh }`. Polling stops on unmount.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Workforce, type ActivityItem, type Approval, type Kpis, type Task } from './api';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useLive<T>(fetcher: () => Promise<T>, intervalMs: number, deps: unknown[] = []): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);
  const tickRef = useRef<number | null>(null);

  const run = useCallback(async () => {
    try {
      const out = await fetcher();
      if (cancelledRef.current) return;
      setData(out);
      setError(null);
    } catch (e) {
      if (cancelledRef.current) return;
      setError(e instanceof Error ? e.message : '로드 실패');
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    cancelledRef.current = false;
    run();
    tickRef.current = window.setInterval(run, intervalMs);
    return () => {
      cancelledRef.current = true;
      if (tickRef.current != null) window.clearInterval(tickRef.current);
    };
  }, [run, intervalMs]);

  return { data, loading, error, refresh: run };
}

export function useKpis(): State<Kpis> {
  return useLive(() => Workforce.kpis(), 5000);
}

export function useActivity(limit = 30): State<{ items: ActivityItem[] }> {
  return useLive(() => Workforce.activity(limit), 5000, [limit]);
}

export function useApprovals(status?: 'pending' | 'approved' | 'rejected'): State<{ approvals: Approval[] }> {
  return useLive(() => Workforce.listApprovals(status), 4000, [status]);
}

export function useTasks(status?: 'todo' | 'in_progress' | 'done' | 'cancelled'): State<{ tasks: Task[] }> {
  return useLive(() => Workforce.listTasks(status), 4000, [status]);
}
