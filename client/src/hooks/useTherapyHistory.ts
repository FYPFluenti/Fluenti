import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface TherapySession {
  id: string;
  type: 'therapy' | 'support';
  mode?: 'voice' | 'chat'; // Add mode property
  title: string;
  date: string | Date;
  duration: string;
  mood?: string;
  notes: string;
  messages?: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  riskLevel?: string;
  score?: number;
  accuracy?: number;
}

interface TherapyHistoryResponse {
  success: boolean;
  sessions: TherapySession[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface UseTherapyHistoryOptions {
  limit?: number;
  type?: 'all' | 'therapy' | 'support';
  mode?: 'all' | 'voice' | 'chat'; // Add mode filtering option
}

export function useTherapyHistory(options: UseTherapyHistoryOptions = {}) {
  const { limit = 20, type = 'all' } = options;
  const { isAuthenticated } = useAuth();
  
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = async (offset = 0, append = false) => {
    if (!isAuthenticated) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(type !== 'all' && { type })
      });

      const { buildApiUrl } = await import('@/lib/apiUtils');
      const response = await fetch(buildApiUrl(`/api/therapy/history?${queryParams}`), {
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

      const data: TherapyHistoryResponse = await response.json();

      if (data.success) {
        // Format dates and ensure consistency
        const formattedSessions = data.sessions.map(session => ({
          ...session,
          date: new Date(session.date).toISOString(),
        }));

        if (append) {
          setSessions(prev => [...prev, ...formattedSessions]);
        } else {
          setSessions(formattedSessions);
        }
        
        setTotal(data.total);
        setHasMore(data.hasMore);
      } else {
        throw new Error('Failed to fetch therapy history');
      }
    } catch (err) {
      console.error('Error fetching therapy history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch therapy history');
      
      // If this is the initial load, set empty state
      if (!append) {
        setSessions([]);
        setTotal(0);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchHistory(sessions.length, true);
    }
  };

  const refresh = () => {
    fetchHistory(0, false);
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory(0, false);
    } else {
      setSessions([]);
      setTotal(0);
      setHasMore(false);
      setError(null);
    }
  }, [isAuthenticated, limit, type]);

  return {
    sessions,
    loading,
    error,
    total,
    hasMore,
    loadMore,
    refresh,
  };
}