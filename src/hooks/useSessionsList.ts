/**
 * Session-list hook for the standalone web UI.
 *
 * The API base URL must stay environment-driven so local development talks to
 * the intended managed-agent-api instance instead of a stale external tunnel.
 */
import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = (
  import.meta.env.VITE_MANAGED_AGENT_API_BASE_URL || 'http://127.0.0.1:3000'
).replace(/\/$/, '');

export interface SessionListItem {
  sessionId: string;
  sessionName: string;
  status: 'idle' | 'running' | 'error';
  createdAt: string;
  lastActiveAt: string;
}

export function useSessionsList(userId: string = 'demo-user') {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch sessions', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    refetch: fetchSessions
  };
}
