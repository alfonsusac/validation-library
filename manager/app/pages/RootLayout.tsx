import { usePackageJson } from "../../features/package-json-client"
import { ProjectSettings } from "./ProjectSettings"

export function RootLayout(props: { children?: React.ReactNode }) {

  const { packageJson } = usePackageJson()

  return (
    <div className="bg-bg text-fg min-w-screen min-h-screen p-4">
      <div className="font-semibold text-sm text-fg-3">Package Manager</div>

      <h1 className="font-mono text-2xl break-all">{packageJson?.name}</h1>
      {props.children}

      <div className="pt-8">
        <h2 className="font-medium text-xl text-fg-4">Project Settings</h2>
        {packageJson ? <ProjectSettings /> : null}
      </div>

      <footer className="pt-20">

      </footer>
    </div>
  )
}