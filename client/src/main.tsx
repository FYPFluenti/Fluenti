import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import WebSocket interceptor to prevent invalid connections
import "./lib/websocketInterceptor";
// Import comprehensive error suppression
import "./lib/errorSuppressor";

createRoot(document.getElementById("root")!).render(<App />);
// Apply dark mode based on localStorage or system preference
if (
  localStorage.theme === "dark" ||
  (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}
