import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import WebSocket interceptor to prevent invalid connections
import "./lib/websocketInterceptor";

createRoot(document.getElementById("root")!).render(<App />);
