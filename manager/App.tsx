import { nanoid } from "nanoid"
import { TestComponent } from "./AppTest"
import { getHello, newQueryClient, QueryClientProvider, useQueryClientStore, useWS } from "./lib/react-store"
import { usePackageJson } from "./features/package-json-client"
import { useUserSettings } from "./features/user-settings-client"
import { navigate, RoutePage } from "./app/app-client"
import { ProjectSettings } from "./app/pages/ProjectSettings"

const qc = newQueryClient()
import.meta.hot.dispose(() => qc.cleanup())

export function AppRoot() {
  return (
    <div className="bg-bg text-fg min-w-screen min-h-screen">
      <QueryClientProvider qc={qc}>
        <App />
      </QueryClientProvider>
    </div>
  )
}

function App() {

  const [ packageJson ] = usePackageJson(false)
  const { userSettings } = useUserSettings()

  return (
    <div className="p-4 relative h-screen w-screen max-w-xl overflow-x-hidden mx-auto">

      <RoutePage path="/" classNames={{ hidden: "-translate-x-1/5" }}>
        <div className="flex flex-col p-4 bg-bg">
          <header className="sticky top-0 -mt-4 -mx-4 p-6 bg-bg z-50">
            <div className="font-semibold text-sm text-fg-3">Package Manager</div>
            <h1 className="font-mono text-2xl break-all">{packageJson?.name}</h1>
          </header>

          <div className="-mx-1 bg-bg-2/50 rounded-xl overflow-hidden">
            <MenuItem
              title="package.json"
              description="Edit project settings."
              onClick={() => navigate("/package-json")}
            />
            <MenuItem
              title="test"
              description="Edit project settings."
              onClick={() => navigate("/package-json")}
            />
          </div>
        </div>
      </RoutePage>

      <RoutePage path="/package-json" classNames={{ hidden: "translate-x-full" }}>
        <div className="flex flex-col p-4 bg-bg">
          <SubpageHeader
            title="Project Settings"
            onBackClick={() => navigate("/")}
          />
          {(packageJson && userSettings) ? <ProjectSettings /> : null}
        </div>
      </RoutePage>

      <footer className="pt-20">
      </footer>
    </div>
  )
}


function SubpageHeader(props: {
  onBackClick: () => void,
  title: React.ReactNode
}) {
  return <header className="flex items-center gap-1 sticky top-0 -m-4 mb-0 p-4 bg-bg z-50">
    <div className="cursor-pointer text-fg-3 w-8 h-8 -ml-1 rounded-2xl hover:bg-fg-2/10 grid place-items-center"
      onClick={props.onBackClick}
    >{'←'}</div>
    <h2 className="font-medium text-xl text-fg">{props.title}</h2>
  </header>
}

function MenuItem(props: {
  title: React.ReactNode,
  description?: React.ReactNode,
  onClick: () => void,
}) {
  return <button
    onClick={props.onClick}
    className="flex justify-between w-full p-3 px-3 hover:bg-bg-2/50 cursor-pointer active:hover:bg-bg-2/75">
    <div className="flex flex-col gap-1 text-start">
      <div>{props.title}</div>
      <div className="text-xs text-fg-3">
        {props.description}
      </div>
    </div>
    <div>{'→'}</div>
  </button>
}