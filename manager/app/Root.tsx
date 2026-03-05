import { createRoot } from "react-dom/client"
import { AppRoot } from "../App"

const getRoot = () => document.getElementById("root")!
const app = <AppRoot />

if (import.meta.hot) {
  const root = import.meta.hot.data.root ??= createRoot(getRoot())
  root.render(app)
} else {
  createRoot(getRoot()).render(app)
}