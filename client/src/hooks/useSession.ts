import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SessionData {
  id: string;
  sessionId: string;
  userId: string;
  type: 'therapy' | 'support';
  mode: 'voice' | 'chat';
  title: string;
  date: string | Date;
  duration: string;
  mood?: string;
  messages: SessionMessage[];
  riskLevel?: string;
  notes: string;
}

interface SessionResponse {
  success: boolean;
  session: SessionData;
}

export function useSession(sessionId: string | null) {
  const { isAuthenticated } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async (id: string) => {
    if (!isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { buildApiUrl } = await import('@/lib/apiUtils');
      const response = await fetch(buildApiUrl(`/api/therapy/session/${id}`), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SessionResponse = await response.json();

      if (data.success) {
        setSession(data.session);
      } else {
        throw new Error('Failed to fetch session details');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    setSession(null);
    setError(null);
  };

  useEffect(() => {
    if (sessionId && isAuthenticated) {
      fetchSession(sessionId);
    } else {
      setSession(null);
      setError(null);
    }
  }, [sessionId, isAuthenticated]);

  return {
    session,
    loading,
    error,
    refetch: sessionId ? () => fetchSession(sessionId) : () => {},
    clearSession
  };
}