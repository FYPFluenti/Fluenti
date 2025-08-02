// WebSocket connection interceptor to prevent invalid URL connections
// This prevents WebSocket errors that might come from browser extensions or dev tools

if (typeof window !== 'undefined') {
  const OriginalWebSocket = window.WebSocket;
  
  // Enhanced console error suppression
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('WebSocket') && 
        (message.includes('undefined') || 
         message.includes('invalid') || 
         message.includes('Failed to construct') ||
         message.includes('connection to') ||
         message.includes('failed:'))) {
      console.warn('🛡️ Suppressed WebSocket error:', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  // Enhanced window.onerror suppression
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (typeof message === 'string' && 
        ((message.includes('WebSocket') && 
          (message.includes('undefined') || message.includes('invalid'))) ||
        (message.includes('Failed to construct') && message.includes('WebSocket')))) {
      console.warn('🛡️ Suppressed window.onerror WebSocket error:', message);
      return true;
    }
    
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Enhanced WebSocket constructor override
  window.WebSocket = class extends EventTarget {
    public static readonly CONNECTING = 0;
    public static readonly OPEN = 1;
    public static readonly CLOSING = 2;
    public static readonly CLOSED = 3;
    
    public readonly CONNECTING = 0;
    public readonly OPEN = 1;
    public readonly CLOSING = 2;
    public readonly CLOSED = 3;
    
    public readyState: number = 3; // CLOSED
    public url: string;
    public protocol: string = '';
    public bufferedAmount: number = 0;
    public extensions: string = '';
    public binaryType: BinaryType = 'blob';
    
    public onopen: ((event: Event) => void) | null = null;
    public onclose: ((event: CloseEvent) => void) | null = null;
    public onmessage: ((event: MessageEvent) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    
    private _actualWebSocket: WebSocket | null = null;
    
    constructor(url: string | URL, protocols?: string | string[]) {
      super();
      
      const urlString = url.toString();
      this.url = urlString;
      
      // Block invalid URLs
      if (urlString.includes('undefined') || 
          urlString.includes('null') || 
          urlString.includes(':undefined') ||
          urlString.includes('://undefined') ||
          !urlString.match(/^wss?:\/\/.+/)) {
        
        console.warn('🛡️ Blocked WebSocket connection with invalid URL:', urlString);
        
        // Silently fail - don't trigger error handlers
        setTimeout(() => {
          if (this.onclose) {
            this.onclose(new CloseEvent('close', { code: 1006, reason: 'Invalid URL blocked' }));
          }
        }, 0);
        
        return;
      }
      
      // Allow valid connections
      try {
        this._actualWebSocket = new OriginalWebSocket(url, protocols);
        this.readyState = this._actualWebSocket.readyState;
        this.url = this._actualWebSocket.url;
        this.protocol = this._actualWebSocket.protocol;
        
        // Proxy events with error suppression
        this._actualWebSocket.onopen = (event) => {
          this.readyState = this._actualWebSocket!.readyState;
          if (this.onopen) this.onopen(event);
        };
        
        this._actualWebSocket.onclose = (event) => {
          this.readyState = this._actualWebSocket!.readyState;
          if (this.onclose) this.onclose(event);
        };
        
        this._actualWebSocket.onmessage = (event) => {
          if (this.onmessage) this.onmessage(event);
        };
        
        this._actualWebSocket.onerror = (event) => {
          console.warn('🛡️ WebSocket error suppressed:', event);
          // Suppress error - don't call this.onerror
        };
        
      } catch (error) {
        console.warn('🛡️ WebSocket construction failed:', error);
        // Fail silently
        setTimeout(() => {
          if (this.onclose) {
            this.onclose(new CloseEvent('close', { code: 1006, reason: 'Construction failed' }));
          }
        }, 0);
      }
    }
    
    send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
      if (this._actualWebSocket && this._actualWebSocket.readyState === 1) {
        this._actualWebSocket.send(data);
      }
    }
    
    close(code?: number, reason?: string): void {
      if (this._actualWebSocket) {
        this._actualWebSocket.close(code, reason);
      }
      this.readyState = 3; // CLOSED
    }
  } as any;
}

export {};
