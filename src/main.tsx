import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;

// Show the real error on screen instead of a blank page (helps debugging on phones)
const showError = (msg: string) => {
  root.innerHTML = `<pre style="color:#f5f5f5;background:#0b0b0b;padding:16px;white-space:pre-wrap;font-size:12px;min-height:100vh">Something went wrong:\n${msg}</pre>`;
};
window.addEventListener("error", (e) => {
  if (!root.hasChildNodes()) showError(String(e.error?.stack || e.message));
});

try {
  createRoot(root).render(<App />);
} catch (e) {
  showError(String((e as Error)?.stack || e));
}
