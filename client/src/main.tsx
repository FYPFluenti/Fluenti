import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import WebSocket interceptor to prevent invalid connections
import "./lib/websocketInterceptor";
// Import comprehensive error suppression
import "./lib/errorSuppressor";

createRoot(document.getElementById("root")!).render(<App />);
