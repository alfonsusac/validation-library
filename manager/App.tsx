import { newQueryClient, QueryClientProvider } from "./lib/react-store"
import { usePackageJson } from "./features/package-json-client"
import { useUserSettings } from "./features/user-settings-client"
import { ProjectSettings } from "./app/pages/ProjectSettings"
import { navigate, RoutePage, useRouter } from "./app/app-routes"
import { ProjectScripts } from "./app/pages/ProjectScripts"

const qc = newQueryClient()
import.meta.hot.dispose(() => qc.cleanup())

export function AppRoot() {
  return (
    <div className="bg-bg text-fg min-w-screen min-h-screen">
      <QueryClientProvider qc={qc}>
        <Init><App /></Init>
      </QueryClientProvider>
    </div>
  )
}

function Init(props: { children: React.ReactNode }) {
  const [ packageJson ] = usePackageJson(false)
  const [ userSettings ] = useUserSettings()
  if (packageJson === undefined || userSettings === undefined) {
    return <div className="grid place-items-center h-screen w-screen">
      <div className="text-fg-3">Loading...</div>
    </div>
  }
  return <>{props.children}</>
}

function App() {

  const [ packageJson ] = usePackageJson(false)
  const router = useRouter()

  return (
    <div className="relative h-screen w-screen 
    overflow-x-hidden mx-auto overflow-y-visible
    ">
      <div className="max-w-xl w-full mx-auto">
        <RoutePage path="/" classNames={{ hidden: "-translate-x-1/6" }}>
          <div className="flex flex-col p-4 bg-bg min-h-screen">
            <header className="gri-d sticky top-0 -mt-4 -mx-4 p-6 bg-bg z-50">
              <div className="font-semibold text-sm text-fg-3">Package Manager</div>
              <h1 className="font-mono text-2xl break-all">{packageJson?.name}</h1>
            </header>

            <div className="-mx-1 bg-bg-2/50 rounded-xl overflow-hidden">
              <MenuItem
                title="package.json"
                description="Edit project settings."
                onClick={() => router.navigate("/package-json")}
              />
              <MenuItem
                title="scripts"
                description="Edit project scripts."
                onClick={() => router.navigate("/scripts")}
              />
            </div>
          </div>
        </RoutePage>

        <RoutePage path="/package-json" classNames={{ hidden: "translate-x-full" }}>
          <div className="flex flex-col p-4 bg-bg min-h-screen">
            <SubpageHeader
              title="Project Settings"
              onBackClick={() => router.navigate("/")}
            />
            <ProjectSettings />
          </div>
        </RoutePage>

        <RoutePage path="/scripts" classNames={{ hidden: "translate-x-full" }}>
          <div className="flex flex-col p-4 bg-bg min-h-screen">
            <SubpageHeader
              title="Project Scripts"
              onBackClick={() => router.navigate("/")}
            />
            <ProjectScripts />
          </div>
        </RoutePage>


      </div>



    </div>
  )
}


function SubpageHeader(props: {
  onBackClick: () => void,
  title: React.ReactNode
}) {
  return <header className="flex items-center gap-1 -mt-4 sticky top-0 bg-bg z-50 h-16">
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
    className="flex justify-between w-full p-3 px-4 pb-4 hover:bg-bg-2/50 cursor-pointer active:hover:bg-bg-2/75">
    <div className="flex flex-col gap-0 text-start">
      <div className="font-medium">{props.title}</div>
      <div className="text-xs text-fg-3">
        {props.description}
      </div>
    </div>
    <div>{'→'}</div>
  </button>
}