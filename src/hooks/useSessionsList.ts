/**
 * Session-list hook for the standalone web UI.
 *
 * The API base URL must stay environment-driven so local development talks to
 * the intended managed-agent-api instance instead of a stale external tunnel.
 */
import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = (
  import.meta.env.VITE_MANAGED_AGENT_API_BASE_URL || 'http://127.0.0.1:4173'
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
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.items || []);
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      }
    } catch (e) {
      console.error('Failed to fetch sessions', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (nextCursor) params.append('cursor', nextCursor);
      
      const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/sessions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(prev => {
          const newItems = data.items || [];
          // Deduplicate based on sessionId to be safe
          const existingIds = prev.map(s => s.sessionId);
          const filtered = newItems.filter((item: SessionListItem) => !existingIds.includes(item.sessionId));
          return [...prev, ...filtered];
        });
        setHasMore(data.hasMore || false);
        setNextCursor(data.nextCursor || null);
      }
    } catch (e) {
      console.error('Failed to load more sessions', e);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, hasMore, nextCursor, loadingMore]);

  useEffect(() => {
    fetchSessions();
    
    const handleSessionChanged = () => {
      fetchSessions();
    };
    
    window.addEventListener('agentos-session-changed', handleSessionChanged);
    return () => {
      window.removeEventListener('agentos-session-changed', handleSessionChanged);
    };
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refetch: fetchSessions
  };
}
