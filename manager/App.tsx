import { cn } from "lazy-cn"
import { ProjectSettings } from "./app/pages/ProjectSettings"
import { AppClientProvider, navigate, RoutePage } from "./app/use-app-client"
import { usePackageJson } from "./features/package-json-client"
import { useUserSettings } from "./features/user-settings-client"

export function AppRoot() {
  return (
    <div className="bg-bg text-fg min-w-screen min-h-screen">
      <AppClientProvider url={"ws://localhost:3000/ws"}>
        <App />
      </AppClientProvider>
    </div>
  )
}

function App() {

  const { packageJson } = usePackageJson()
  const { userSettings } = useUserSettings()



  return (
    <div className="p-4 relative h-full">

      <RoutePage path="/" classNames={{ hidden: "-translate-x-1/5" }}>
        <div className="flex flex-col p-4 bg-bg">
          <header className="sticky top-0 -mt-4 -mx-4 p-6 bg-bg z-50">
            <div className="font-semibold text-sm text-fg-3">Package Manager</div>
            <h1 className="font-mono text-2xl break-all">{packageJson?.name}</h1>
          </header>

          <div className="-mx-1">
            <button
              onClick={() => navigate("/package-json")}
              className="flex justify-between w-full p-3 px-3 rounded-md bg-bg-2/30 hover:bg-bg-2/50 cursor-pointer active:hover:bg-bg-2/75">
              <div className="flex flex-col gap-1 text-start">
                <div>package.json</div>
                <div className="text-xs text-fg-3">
                  Edit project settings.
                </div>
              </div>
              <div>{'→'}</div>
            </button>
          </div>
        </div>
      </RoutePage>

      <RoutePage path="/package-json" classNames={{ hidden: "translate-x-full" }}>
        <div className="flex flex-col p-4 bg-bg">
          <header className="flex items-center gap-1 sticky top-0 -m-4 p-4 bg-bg z-50">
            <div className="cursor-pointer text-fg-3 w-8 h-8 -ml-1 rounded-2xl hover:bg-fg-2/10 grid place-items-center"
              onClick={() => navigate("/")}
            >{'←'}</div>
            <h2 className="font-medium text-xl text-fg">Project Settings</h2>
          </header>
          {(packageJson && userSettings) ? <ProjectSettings /> : null}
        </div>
      </RoutePage>

      <footer className="pt-20">
      </footer>
    </div>
  )
}