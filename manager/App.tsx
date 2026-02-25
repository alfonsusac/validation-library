import { createWsStore } from "./AppState"
import type { PackageJson } from "./lib/event-package-json"
import { ProjectSettings } from "./ProjectSettings"

export const [ usePackageJson ] = createWsStore<PackageJson>("packageJSON", {
  requestData(ws) {
    ws.send(JSON.stringify({ type: "getPackageJSON" }))
  },
  requestUpdate(ws, data) {
    ws.send(JSON.stringify({ type: "updatePackageJSON", params: [ data ] }))
  },
  onMessage(event) {
    const data = JSON.parse(event.data)
    if (data.type === "getPackageJSON") {
      return data.data as PackageJson
    }
    return undefined
  }
})


export function App() {
  const [ packageJSON ] = usePackageJson()

  return (
    <div className="bg-bg text-fg min-w-screen min-h-screen p-4">
      <div className="font-semibold text-sm text-fg-3">Package Manager</div>
      <h1 className="font-mono text-2xl">{packageJSON?.name}</h1>
      <div className="pb-12" />

      <h2 className="font-medium text-xl text-fg-4">Project Settings</h2>
      {packageJSON ?
        <ProjectSettings packageJSON={packageJSON} /> : null
      }

    </div>
  )
}