import { useState, useEffect, useRef, useCallback } from 'react';

// Get API base from environment or default to localhost:3000
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://fluentiai-backend.onrender.com' 
  : 'http://localhost:3000';

// Convert HTTP URL to WebSocket URL with proper validation
const getWebSocketUrl = (url: string) => {
  if (!url || url.includes('undefined') || url.includes('null')) {
    console.warn('Invalid URL provided to getWebSocketUrl:', url);
    return 'ws://localhost:3000'; // Fallback to safe default
  }
  
  try {
    const wsUrl = url.replace('https://', 'wss://').replace('http://', 'ws://');
    // For localhost, ensure port is included
    if (wsUrl.includes('localhost') && !wsUrl.includes(':')) {
      return 'ws://localhost:3000';
    }
    return wsUrl;
  } catch (error) {
    console.warn('Error converting to WebSocket URL:', error);
    return 'ws://localhost:3000'; // Fallback to safe default
  }
};

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  allowUnauthenticated?: boolean; // Allow connection without auth token
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  disconnect: () => void;
  connect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const { onMessage, onError, onOpen, onClose, allowUnauthenticated } = options;
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef<NodeJS.Timeout>();

  // Set up localStorage event listener to detect auth changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('authToken');
      setAuthToken(newToken);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check token periodically
    const tokenCheckInterval = setInterval(() => {
      const currentToken = localStorage.getItem('authToken');
      if (currentToken !== authToken) {
        setAuthToken(currentToken);
      }
    }, 3000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(tokenCheckInterval);
    };
  }, [authToken]);
  
  // Reconnect when auth token changes
  useEffect(() => {
    if (socket) {
      // Disconnect and reconnect when auth token changes
      console.log('Auth token changed, reconnecting WebSocket');
      disconnect();
      connect();
    }
  }, [authToken]);

  const connect = useCallback(() => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Check if we should allow unauthenticated connections
      if (!token && !options.allowUnauthenticated) {
        console.log('No auth token available and unauthenticated connections not allowed');
        return;
      }
      
      // Use consistent API base URL and convert to WebSocket protocol
      const WS_BASE = getWebSocketUrl(API_BASE_URL);
      
      // Validate WebSocket base URL
      if (!WS_BASE) {
        console.error('🛡️ Failed to create valid WebSocket URL from:', API_BASE_URL);
        return;
      }
      
      // Add authentication token to WebSocket connection if available
      let wsUrl = `${WS_BASE}/ws`;
      
      // Additional validation for undefined values
      if (wsUrl.includes('undefined') || wsUrl.includes('null') || wsUrl.includes(':undefined')) {
        console.error('🛡️ Invalid WebSocket URL detected, aborting connection:', wsUrl);
        console.error('API_BASE_URL:', API_BASE_URL);
        console.error('WS_BASE:', WS_BASE);
        return;
      }
      
      // Add token as query parameter if available
      if (token && token.length > 0 && token !== 'null' && token !== 'undefined') {
        console.log('🔗 Connecting WebSocket with token:', token.substring(0, 8) + '...');
        wsUrl += `?token=${encodeURIComponent(token)}`;
      }
      
      // Final URL validation
      if (!wsUrl.match(/^wss?:\/\/.+:\d+/)) {
        console.error('🛡️ WebSocket URL failed validation:', wsUrl);
        return;
      }
      
      console.log('🔌 Connecting to WebSocket:', {
        url: wsUrl.replace(/token=[^&]+/, 'token=***'),
        hasToken: !!token,
        baseUrl: API_BASE_URL,
        isProd: import.meta.env.PROD
      });
      
      // Create WebSocket with validation
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        onOpen?.();
        
        // Send authentication message as fallback
        if (token) {
          try {
            ws.send(JSON.stringify({
              type: 'auth',
              data: { token }
            }));
          } catch (error) {
            console.error('Failed to send auth message:', error);
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Log additional connection details for debugging
        console.log('WebSocket connection details:', {
          url: wsUrl,
          readyState: ws.readyState,
          protocol: ws.protocol,
          isSecure: wsUrl.startsWith('wss:')
        });
        onError?.(error);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected (Code: ${event.code}, Reason: ${event.reason || 'No reason provided'})`);
        setIsConnected(false);
        setSocket(null);
        onClose?.();

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          
          reconnectInterval.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        }
      };

      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    if (reconnectInterval.current) {
      clearTimeout(reconnectInterval.current);
    }
    
    if (socket) {
      socket.close();
    }
  }, [socket]);

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [socket]);

  useEffect(() => {
    // Don't auto-connect WebSocket unless explicitly needed
    // Components should call connect() manually when they need WebSocket functionality
    console.log('WebSocket hook initialized but not auto-connecting');
    
    // Listen for storage events to handle auth changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        if (e.newValue && socket) {
          // Token was added/changed and socket exists - reconnect
          disconnect();
          connect();
        } else if (!e.newValue && socket) {
          // Token was removed - disconnect
          disconnect();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      disconnect();
    };
  }, [connect, disconnect, socket]);

  return {
    socket,
    isConnected,
    sendMessage,
    disconnect,
    connect
  };
}
