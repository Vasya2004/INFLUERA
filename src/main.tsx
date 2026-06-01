import { createRoot } from "react-dom/client";
import App from "./App";
import { registerAppVersionRefresh } from "./lib/app-version-refresh";
import "./index.css";

registerAppVersionRefresh();

createRoot(document.getElementById("root")!).render(<App />);
