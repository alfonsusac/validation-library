import { createPackageJsonClient } from "./lib/package-json-client"
import { ProjectSettings } from "./ProjectSettings"


export const [ usePackageJson ] = createPackageJsonClient()

export function App() {
  const [ packageJSON ] = usePackageJson()

  return (
    <div className="bg-bg text-fg min-w-screen min-h-screen p-4">
      <div className="font-semibold text-sm text-fg3">Package Manager</div>
      <h1 className="font-mono text-2xl break-all">{packageJSON?.name}</h1>
      <div className="pb-12" />

      <h2 className="font-medium text-xl text-fg4">Project Settings</h2>
      {packageJSON ? <ProjectSettings packageJSON={packageJSON} /> : null}

      <footer className="pt-20">

      </footer>
    </div>
  )
}