import { createRoot } from "react-dom/client"
import { App } from "./App"

const getRoot = () => document.getElementById("root")!
const app = <App />

if (import.meta.hot) {
  const root = import.meta.hot.data.root ??= createRoot(getRoot())
  root.render(app)
} else {
  createRoot(getRoot()).render(app)
}