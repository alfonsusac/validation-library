import { useEffect, type ComponentProps } from "react"
import { usePackageJson } from "../../features/package-json-client"
import { BasicFieldFooter, CollectionInputItemGroup, ErrorMessage, H2, InputBase, InputBlock, InputBlockFooter, InputBlockMessage, InputButton, LucidePlus, SubInput, useField, WarnMessages } from "../app-ui"
import { cn } from "lazy-cn"
import { useRouter } from "../app-routes"
import type { Updater } from "../../lib/react-store"

export function ProjectScripts() {
  const [ packageJson, setPackageJson ] = usePackageJson()
  const scripts = Object.entries(packageJson.scripts ?? {}).map(([ name, command ]) => ({ name, command }))
  const toScriptObject = (scripts: { name: string, command: string }[]) => {
    const obj: Record<string, string> = Object.fromEntries(scripts.map(script => [ script.name, script.command ]))
    return obj
  }

  const field = useField(scripts, {
    validate: (value) => {
      const errors: { name: string | undefined, command: string | undefined }[] =
        value.map((script, index) => {
          const error = {
            name: (() => {
              if (!script.name) return "Script name is required"
              if (value.findIndex(s => s.name === script.name) !== index) return "Script name must be unique"
              return undefined
            })(),
            command: (() => {
              if (!script.command) return "Script command is required"
              return undefined
            })()
          }
          return error
        })
      return errors
    },
    onSave: (value) => {
      const newScripts = toScriptObject(value)
      console.log("Saving scripts:", newScripts)
      setPackageJson({
        scripts: newScripts,
      })
    },
    hasNoErrorFn: (errors) => {
      if (errors === undefined) return true
      return errors.every(error => error.name === undefined && error.command === undefined)
    }
  })

  const router = useRouter()
  useEffect(() => {
    if (!field.isChanged) return
    return router.addInterruption()
  }, [ field.isChanged ])

  return (
    <div className="flex flex-col gap-12 py-4">

      {/* Unsaved Changes Alert */}
      <div className={cn("bg-linear-to-b from-bg to-bg/0 fixed z-90 left-0 right-0 bottom-0 p-4 flex justify-center pointer-events-none transition-all",
        !field.isChanged && "opacity-0"
      )}>
        <div className={cn("bg-bg-2 p-2.5 rounded-xl flex gap-2 justify-end items-center w-fit max-w-110 pointer-events-auto",
          "w-full",
          "transition-all transition-discrete relative",
          !field.isChanged && "-top-0 pointer-events-none",
        )}>
          <div className="flex gap-2">
            <button
              disabled={!field.resettable}
              onClick={() => field.reset()}
              className="button py-1.5 px-6 ghost">Discard</button>
            <button
              disabled={!field.saveable}
              onClick={() => field.forceSave()}
              className="button py-1.5 px-6">Save</button>
          </div>
        </div>
      </div>
      {/* Unsaved Changes Alert END */}


      <div className="flex flex-col gap-6">

        <H2>User Defined Scripts</H2>
        <p className="text-fg-2 -mt-4">
          Define custom scripts that can be run using npm. These scripts can be used for various tasks such as building, testing, or deploying your project.
        </p>
        <div className="flex flex-col gap-2">
          {field.value.map((script, index) => {
            return (
              <ScriptInput key={index}
                error={field.error && field.error[ index ]}
                savedValue={script}
                valueState={{
                  value: script,
                  setValue: (value) => field.setValue(old => {
                    if (typeof value === "function") {
                      value = value(old[ index ])
                    }
                    return old.map((s, i) => i === index ? value as { name: string, command: string } : s)
                  }),
                }}
                onDelete={() => {
                  field.setValue(old => old.filter((_, i) => i !== index))
                }}
              />
            )
          })}
          <InputButton onClick={() => {
            field.setValue(old => [ ...old, { name: `script-${field.value.length + 1}`, command: "bun dev" } ])
          }}>
            <LucidePlus />
            Add Script
          </InputButton>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <H2>Life Cycle Scripts</H2>
        <p className="text-fg-2 -mt-4">
          These scripts are predefined by npm and run automatically at specific stages of the package lifecycle. You can customize these scripts to automate tasks such as testing, building, or deploying your project.
        </p>
      </div>
    </div>
  )
}



function ScriptInput(props: {
  error: undefined | string | { name: string | undefined, command: string | undefined },
  savedValue: { name: string, command: string },
  valueState: {
    value: { name: string, command: string },
    setValue: (value: Updater<{ name: string, command: string }>) => void,
  }
  onDelete: () => void,
}) {

  // how do i make sure that if the user has made changes to the script, and tries to navigate away, they will be prompted to save or discard changes?

  // how do i check if the name is unique among all scripts? I need to have access to the list of all scripts in the validation function, but the validation function only receives the current script value. Maybe I can pass the list of all scripts as a parameter to the validation function, and then check if there is another script with the same name?

  return (
    <InputBlock
      className="starting:opacity-0 transition-opacity duration-250 my-0"
    >
      <CollectionInputItemGroup
        error={typeof props.error === "string" ? props.error : undefined}
        single
      >
        <SubInput
          Icon={(props) => {
            return <div
              className={cn(props.className, "font-mono flex items-center text-sm")}
            >npm run</div>
          }}
          value={props.valueState.value.name}
          placeholder="<script name>"
          onSetNotUndefined={() => { }}
          onSetUndefined={() => {
            props.onDelete()
          }}
          inputOnChange={(e) => {
            props.valueState.setValue(old => ({ ...old, name: e.target.value }))
          }}
          setLabel="Set Repository URL"
          error={typeof props.error === "object" ? props.error.name : undefined}
        />
        <SubInput
          Icon={(props) => {
            return <div
              className={cn(props.className, "font-mono flex items-center text-sm")}
            >npx</div>
          }}
          value={props.valueState.value.command}
          placeholder="<script command>"
          onSetNotUndefined={() => { }}
          onSetUndefined={() => { }}
          inputOnChange={(e) => {
            props.valueState.setValue(old => ({ ...old, command: e.target.value }))
          }}
          setLabel="Set Repository Type"
          clearable={false}
          error={typeof props.error === "object" ? props.error.command : undefined}

        />
      </CollectionInputItemGroup>
    </InputBlock>
  )
}