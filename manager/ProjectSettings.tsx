import { useState } from "react"
import type { PackageJson } from "./lib/event-package-json"
import { usePackageJson } from "./App"

export function ProjectSettings(props: {
  packageJSON: PackageJson,
}) {
  return <>
    <ProjectNameInput />
  </>

}

function ProjectNameInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson(true)
  const [ name, setName ] = useState(packageJson.name)
  const isChanged = name !== packageJson.name
  const isValid = name.length > 0

  return <div className="py-2">
    <div className="outline-fg-4 focus-within:outline-2 my-2 rounded bg-bg-2 pt-1 flex flex-col">
      <label className="text-xs text-fg-3 px-2 block">Name</label>
      <input className='w-full text-fg rounded p-2 px-2.5 font-mono text-sm outline-none'
        value={name}
        onChange={e => {
          const value = (e.target as any).value
          setName(value)
        }}
      />
      <div className="flex self-end pr-2 gap-2 pb-2">
        <button className="button">
          Check
        </button>
        <button className="button" onClick={() => {
          if (!isValid) return
          const newPackageJson = { ...packageJson }
          newPackageJson.name = name
          updatePackageJson(newPackageJson)
        }}>
          Save
        </button>
      </div>
    </div>
    <div className="text-fg-3 text-xs">
      The name of the package. If If you don't plan to publish your package, the name and version fields are optional.
    </div>
  </div>
}