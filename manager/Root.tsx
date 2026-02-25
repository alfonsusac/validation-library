import { createRoot } from "react-dom/client"
import { App } from "./App"

const container = (globalThis as any).document.getElementById("root")!
const root = createRoot(container)
root.render(<App />)