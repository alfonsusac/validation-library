import { call } from "./app/use-app-client"
import { usePackageJson } from "./features/package-json-client"
import { useAsync } from "./lib/react-async"

export function TestComponent() {

  const { packageJson } = usePackageJson()

  useAsync(async () => {
    const res = await call('getTime')
    // console.log("Server time:", res)
  })

  return <div className="flex flex-col">
    {JSON.stringify(packageJson)}
  </div>
}