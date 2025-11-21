import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getQueryFn } from "@/lib/queryClient";

export interface StoryGameProgress {
  id: string;
  userId: string;
  hasCompletedInitialSetup: boolean;
  selectedTherapyType: 'pronunciation' | 'fluency' | 'dld' | 'social' | null;
  assessments: {
    pronunciation?: {
      level: number;
      title: string;
      feedback: string;
      completedAt: string;
    };
    fluency?: {
      level: number;
      title: string;
      feedback: string;
      completedAt: string;
    };
    dld?: {
      level: number;
      title: string;
      feedback: string;
      completedAt: string;
    };
    social?: {
      level: number;
      title: string;
      feedback: string;
      completedAt: string;
    };
  };
  currentLevels: {
    pronunciation: number;
    fluency: number;
    dld: number;
    social: number;
  };
  totalGamesPlayed: number;
  totalStoriesCompleted: number;
  totalChallengesCompleted: number;
  highestScore: number;
  badgesEarned: {
    pronunciation: string[];
    fluency: string[];
    dld: string[];
    social: string[];
  };
  therapyStats?: {
    pronunciation: {
      totalSessions: number;
      totalStoriesCompleted: number;
      totalChallengesCompleted: number;
      highestScore: number;
      averageScore: number;
    };
    fluency: {
      totalSessions: number;
      totalStoriesCompleted: number;
      totalChallengesCompleted: number;
      highestScore: number;
      averageScore: number;
    };
    dld: {
      totalSessions: number;
      totalStoriesCompleted: number;
      totalChallengesCompleted: number;
      highestScore: number;
      averageScore: number;
    };
    social: {
      totalSessions: number;
      totalStoriesCompleted: number;
      totalChallengesCompleted: number;
      highestScore: number;
      averageScore: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export function useStoryGameProgress() {
  const { isAuthenticated, user } = useAuth();
  
  const { data, isLoading, error } = useQuery<StoryGameProgress>({
    queryKey: ["/api/story-game/progress"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!isAuthenticated && !!user,
    retry: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    progress: data,
    isLoading,
    error,
  };
}

export function useSaveStoryGameProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<StoryGameProgress>) => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
        ? 'https://fluentiai-backend.onrender.com' 
        : 'http://localhost:3000');
      
      const response = await fetch(`${API_BASE_URL}/api/story-game/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to save story game progress');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch progress data
      queryClient.invalidateQueries({ queryKey: ["/api/story-game/progress"] });
    }
  });
}

export interface StoryGameSession {
  id: string;
  userId: string;
  sessionId: string;
  therapyType: 'pronunciation' | 'fluency' | 'dld' | 'social';
  character?: string;
  theme?: string;
  totalScore?: number;
  speechScore?: number;
  creativityScore?: number;
  endingType?: 'happy' | 'sad' | 'neutral';
  challengesCompleted?: number;
  levelAtStart?: number;
  levelAtEnd?: number;
  levelUp?: boolean;
  storyLength?: number;
  wordBank?: string[];
  startTime: string;
  endTime: string;
  duration?: number;
  createdAt: string;
}

export function useStoryGameSessions(limit: number = 50) {
  const { isAuthenticated, user } = useAuth();
  
  const { data, isLoading, error } = useQuery<{
    sessions: StoryGameSession[];
    total: number;
    limit: number;
    offset: number;
  }>({
    queryKey: ["/api/story-game/sessions", limit],
    queryFn: async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
        ? 'https://fluentiai-backend.onrender.com' 
        : 'http://localhost:3000');
      
      const response = await fetch(`${API_BASE_URL}/api/story-game/sessions?limit=${limit}&offset=0`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          
          if (refreshRes.ok) {
            const retryResponse = await fetch(`${API_BASE_URL}/api/story-game/sessions?limit=${limit}&offset=0`, {
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });
            if (!retryResponse.ok) {
              throw new Error('Failed to fetch sessions');
            }
            return retryResponse.json();
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return { sessions: [], total: 0, limit, offset: 0 };
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      return response.json();
    },
    enabled: !!isAuthenticated && !!user,
    retry: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    sessions: data?.sessions || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
}

export function useSaveStoryGameSession() {
  return useMutation({
    mutationFn: async (sessionData: {
      sessionId: string;
      therapyType: 'pronunciation' | 'fluency' | 'dld' | 'social';
      character?: string;
      theme?: string;
      totalScore?: number;
      speechScore?: number;
      creativityScore?: number;
      endingType?: 'happy' | 'sad' | 'neutral';
      challengesCompleted?: number;
      levelAtStart?: number;
      levelAtEnd?: number;
      levelUp?: boolean;
      storyLength?: number;
      wordBank?: string[];
      startTime?: string;
      endTime?: string;
    }) => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
        ? 'https://fluentiai-backend.onrender.com' 
        : 'http://localhost:3000');
      
      let response = await fetch(`${API_BASE_URL}/api/story-game/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(sessionData)
      });

      // Handle 401 by attempting token refresh
      if (response.status === 401) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          
          if (refreshRes.ok) {
            // Token refreshed, retry original request
            response = await fetch(`${API_BASE_URL}/api/story-game/session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify(sessionData)
            });
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Authentication failed. Please log in again.');
        }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to save story game session: ${errorText}`);
      }

      return response.json();
    }
  });
}

