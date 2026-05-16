import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = 'https://70ef-27-38-208-224.ngrok-free.app';

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
      const res = await fetch(`${API_BASE_URL}/users/${userId}/sessions`);
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
