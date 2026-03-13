import { useEffect, type ComponentProps } from "react"
import { usePackageJson } from "../../features/package-json-client"
import { AddButton, BasicFieldFooter, CloseButton, CollectionInputItemGroup, ErrorMessage, H2, InputBase, InputBlock, InputBlockFooter, InputBlockMessage, InputButton, InputDescription, LucidePlus, SomeSortOfConfirmThing, SomeSortOfConfirmThingWrapper, SubInput, useField, useIndexedReorderDrag, WarnMessages } from "../app-ui"
import { cn } from "lazy-cn"
import { useRouter } from "../app-routes"
import { resolveUpdater, type Updater } from "../../lib/react-store"

type ScriptsListArray = {
  name: string, command: string, precommand?: string, postcommand?: string,
  userDefined: boolean,
}[]

type ScriptErrors = ({
  name: string | undefined,
  command: string | undefined,
  precommand: string | undefined,
  postcommand: string | undefined,
} | undefined)[]

export function ProjectScripts() {
  const [ packageJson, setPackageJson ] = usePackageJson()

  const reservedLifeCycleScripts = [
    "prepublish", "publish", "postpublish", "prepublishOnly",
    "prepack", "prepare", "postpack",
    "preinstall", "install", "postinstall",
    "preuninstall", "uninstall", "postuninstall",
    "preversion", "version", "postversion",
    "pretest", "test", "posttest",
    "prestop", "stop", "poststop",
    "prestart", "start", "poststart",
    "prerestart", "restart", "postrestart",
  ]

  const reservedLifeCycleScriptsNoPrepost: { name: string, desc: string }[] = [
    {
      name: "start",
      desc: "This script will be run when you run npm start."
    },
    {
      name: "test",
      desc: "This script will be run when you run npm test."
    },
    {
      name: "install",
      desc: "This script will be run when you run npm install."
    },
    {
      name: "prepublishOnly",
      desc: "Runs before package is prepared and packed, only on `npm publish`. This is a good place to put pre-publish checks or tests that you don't want run on local `npm install`."
    },
    {
      name: "prepare",
      desc: "Runs before package is packed, and on local npm install without any arguments."
    },
    {
      name: "publish",
      desc: "Run when the package is published."
    },
    {
      name: "stop",
      desc: "This script will be run when you run npm stop."
    },
    {
      name: "restart",
      desc: "Runs when the restart command is executed. If there is a restart script defined, these events are run; otherwise, stop and start are both run if present, including their pre and post iterations)"
    },
    {
      name: "version",
      desc: "This script will be run when you run npm version."
    },
    {
      name: "uninstall",
      desc: "This script will be run when you run npm uninstall. However, it is deprecated and should not be used. Use preuninstall or postuninstall instead."
    },

  ]

  const scripts = Object.entries(packageJson.scripts ?? {}).map<ScriptsListArray[ number ]>(([ name, command ]) => {
    const isUserDefined = !reservedLifeCycleScripts.includes(name)
    return ({ name, command, userDefined: isUserDefined })
  })
  const toScriptObject = (scripts: { name: string, command: string }[]) => {
    const obj: Record<string, string> = Object.fromEntries(scripts.map(script => [ script.name, script.command ]))
    return obj
  }

  const validateUserDefinedScripts = (value: ScriptsListArray): ScriptErrors | undefined => {
    const errors: ({ name: string | undefined, command: string | undefined, precommand: string | undefined, postcommand: string | undefined } | undefined)[] =
      value.map((script, index) => {
        const error = {
          name: (() => {
            if (!script.name)
              return "Script name is required"
            if (value.findIndex(s => s.name === script.name) !== index)
              return "Script name must be unique"
            if (value.find(s => s.name === `pre${ script.name }`))
              return "This name is reserved for a pre-script of a user defined script"
            if (value.find(s => s.name === `post${ script.name }`))
              return "This name is reserved for a post-script of a user defined script"
            if (script.userDefined && reservedLifeCycleScripts.includes(script.name))
              return "This name is reserved for life cycle scripts"
            return undefined
          })(),
          command: (() => {
            if (!script.command) return "Script command is required"
            return undefined
          })(),
          precommand: (() => {
            return undefined
          })(),
          postcommand: (() => {
            return undefined
          })(),
        }
        if (error.name === undefined && error.command === undefined)
          return undefined
        return error
      })
    if (errors.every(error => error === undefined)) return undefined
    return errors
  }

  const field = useField(scripts, {
    validate: validateUserDefinedScripts,
    onSave: (value) => {
      const newScripts = toScriptObject(value)
      setPackageJson({ scripts: newScripts, })
    },
  })

  const userDefinedScriptsValue = field.value.filter(script => script.userDefined)
  const userDefinedScriptsIndices = field.value.map((script, index) => script.userDefined ? index : null).filter(index => index !== null) as number[]
  const userDefinedScriptsErrors = field.error && field.error.filter((_, index) => userDefinedScriptsIndices.includes(index))

  const reservedScriptsIndices = reservedLifeCycleScriptsNoPrepost.map(
    reserved => field.value.findIndex(script => script.name === reserved.name)
  )

  const addUserDefinedScript = () => field.setValue(old => [ ...old, { name: `script-${ field.value.length + 1 }`, command: "bun dev", userDefined: true } ])
  const deleteUserDefinedScript = (index: number) => field.setValue(old => old.filter((_, i) => i !== userDefinedScriptsIndices[ index ]))
  const changeUserDefinedScript = (index: number, updater: Updater<{ name: string, command: string }>) => {
    field.setValue(old => {
      const userDefinedScriptIndex = userDefinedScriptsIndices[ index ]
      const value = resolveUpdater(updater, old[ userDefinedScriptIndex ])
      return old.map((s, i) => i === userDefinedScriptIndex ? { ...s, ...value } : s)
    })
  }

  const router = useRouter()
  useEffect(() => {
    if (!field.isChanged) return
    return router.addInterruption()
  }, [ field.isChanged ])

  const { onDragEnd } = useIndexedReorderDrag({
    value: field.value,
    onChange: (_, newIndices) => {
      console.log("Old", field.value)
      console.log("New", newIndices)
      field.setValue(old => {
        const reordered = [ ...old ]
        newIndices.forEach((newIndex, oldIndex) => {
          const oldUserDefinedIndex = userDefinedScriptsIndices[ oldIndex ]
          const newUserDefinedIndex = userDefinedScriptsIndices[ newIndex ]
          reordered[ newUserDefinedIndex ] = old[ oldUserDefinedIndex ]
          // this is the new position of the item that was at oldIndex
        })
        return reordered
      })
    },
  })

  return (
    <div className="flex flex-col gap-12 py-4 pb-20">

      {/* Unsaved Changes Alert */}
      <SomeSortOfConfirmThingWrapper shown={field.isChanged}>
        <SomeSortOfConfirmThing shown={field.isChanged}>
          <div className="flex gap-2">
            <button disabled={!field.resettable} onClick={field.reset}
              className="button py-1.5 px-6 ghost">Discard</button>
            <button disabled={!field.saveable} onClick={field.save}
              className="button py-1.5 px-6">Save</button>
          </div>
        </SomeSortOfConfirmThing>
      </SomeSortOfConfirmThingWrapper>
      {/* Unsaved Changes Alert END */}

      {/* User Defined Scripts */}
      <div className="flex flex-col gap-6">
        <H2>User Defined Scripts</H2>
        <p className="text-fg-2 -mt-4">
          Define custom scripts that can be run using npm. These scripts can be used for various tasks such as building, testing, or deploying your project.
        </p>
        <UserDefinedScriptInputList
          userValues={userDefinedScriptsValue}
          errors={userDefinedScriptsErrors ?? []}
          onAddScript={addUserDefinedScript}
          onDeleteScript={deleteUserDefinedScript}
          onChangeScript={changeUserDefinedScript}
          onDragEnd={onDragEnd}
        />
      </div>
      {/* User Defined Scripts END */}


      {/* Reserved Life Cycle Scripts */}
      <div className="flex flex-col gap-6">
        <H2>Life Cycle Scripts</H2>
        <p className="text-fg-2 -mt-4">
          These scripts are predefined by npm and run automatically at specific stages of the package lifecycle. You can customize these scripts to automate tasks such as testing, building, or deploying your project.
        </p>
        <div className="flex flex-col gap-2">
          {reservedLifeCycleScriptsNoPrepost.map((reservedScript, index) => {
            const isSet = field.value.find(script => script.name === reservedScript.name)

            if (!isSet) {
              return <AddButton
                key={reservedScript.name}
                label={<>Add <span className="text-fg-2">{reservedScript.name}</span> script</>}
                desc={reservedLifeCycleScriptsNoPrepost[ index ].desc}
                onClick={() => {
                  field.setValue(old => [ ...old, { name: reservedScript.name, command: "", userDefined: false } ])
                }}
              />

            }

            return <ReservedScriptInput
              key={reservedScript.name}
              error={field.error && field.error[ reservedScriptsIndices[ index ] ]}
              savedValue={isSet}
              valueState={{
                value: isSet,
                setValue: (updater) => field.setValue(old => {
                  const value = resolveUpdater(updater, old[ reservedScriptsIndices[ index ] ])
                  return old.map((s, i) => i === reservedScriptsIndices[ index ] ? { ...s, ...value } : s)
                }),
              }}
              onDelete={() => {
                field.setValue(old => old.filter((_, i) => i !== reservedScriptsIndices[ index ]))
              }}
              description={reservedLifeCycleScriptsNoPrepost[ index ].desc}
            />
          })}
        </div>
      </div>
      {/* Reserved life Cycle Scripts END */}


    </div>
  )
}



function UserDefinedScriptInputList(props: {
  userValues: ScriptsListArray,
  errors: ScriptErrors,
  onAddScript: () => void,
  onDeleteScript: (index: number) => void,
  onChangeScript: (index: number, updater: Updater<{ name: string, command: string }>) => void,
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void,
}) {



  return <>
    <div className="flex flex-col gap-2">
      {props.userValues.map((script, index) => {
        return (
          <ScriptInput key={index}
            error={props.errors[ index ]}
            savedValue={script}
            valueState={{
              value: script,
              setValue: (updater) => props.onChangeScript(index, updater),
            }}
            onDelete={() => props.onDeleteScript(index)}
            onDragEnd={(e) => props.onDragEnd(e)} // can't be dragged 
            data-drop-id={index.toString()}
          />
        )
      })}
      <InputButton
        onClick={() => props.onAddScript()}
      >
        <LucidePlus />
        Add Script
      </InputButton>
    </div>
  </>
}






function ScriptInput(props: {
  error: undefined | string | { name: string | undefined, command: string | undefined },
  savedValue: { name: string, command: string },
  valueState: {
    value: { name: string, command: string },
    setValue: (value: Updater<{ name: string, command: string }>) => void,
  }
  onDelete: () => void,
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void,
  [ "data-drop-id" ]: string,
}) {

  return (
    <>
      <InputBlock
        className="starting:opacity-0 transition-opacity duration-250 my-0"
        draggable
        onDragEnd={props.onDragEnd}
        data-drop-id={props[ "data-drop-id" ]}
      >
        <CollectionInputItemGroup
          error={typeof props.error === "string" ? props.error : undefined}
          single
        >
          <SubInput
            Icon={(iconprops) => {
              return <div
                className={cn(iconprops.className, "font-mono flex items-center text-sm pointer-events-none")}
              >npm run
              </div>
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
                className={cn(props.className, "font-mono flex items-center text-sm pointer-events-none")}
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
        <InputBlockFooter
          className="justify-end"
          expanded={true}
        >
          <div className="flex">
            <InputButton
              onClick={() => {
              }}
              className="h-8 px-4 rounded"
            >
              Add pre{props.valueState.value.name}
            </InputButton>
            <InputButton
              onClick={() => {
              }}
              className="h-8 px-4 rounded"
            >
              Add post{props.valueState.value.name}
            </InputButton>
          </div>
        </InputBlockFooter>
      </InputBlock>
    </>
  )
}


function ReservedScriptInput(props: {
  error: undefined | string | { name: string | undefined, command: string | undefined },
  savedValue: { name: string, command: string },
  valueState: {
    value: { name: string, command: string },
    setValue: (value: Updater<{ name: string, command: string }>) => void,
  }
  onDelete: () => void,
  description: string,
}) {
  return <div className="flex flex-col mb-2 starting:opacity-0 transition-opacity duration-300">
    <InputBlock className="">

      <div className="flex flex-row">
        <CollectionInputItemGroup
          className="grow"
          error={typeof props.error === "string" ? props.error : undefined}
          single
        >
          <SubInput
            Icon={(iconprops) => {
              return <div
                className={cn(iconprops.className, "font-mono flex items-center text-sm pointer-events-none")}
              >{props.valueState.value.name}:</div>
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
        <div>
          <CloseButton onClick={() => { props.onDelete() }} />
        </div>
      </div>


    </InputBlock>
    <InputDescription>
      {props.description}
    </InputDescription>
  </div>
}
