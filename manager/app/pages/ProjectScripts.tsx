import { useEffect } from "react"
import { usePackageJson } from "../../features/package-json-client"
import { CollectionInputItemGroup, H2, InputBlock, InputBlockFooter, InputButton, InputDescription, LucidePlus, SomeSortOfConfirmThing, SomeSortOfConfirmThingWrapper, SubInput, useField, useIndexedReorderDrag, type FieldState } from "../app-ui"
import { cn } from "lazy-cn"
import { useRouter } from "../app-routes"
import { resolveUpdater, type Updater } from "../../lib/react-store"

type ScriptsListArray = {
  name: string, command: string
  userDefined: boolean,
}[]

type ScriptErrors = ({
  name: string | undefined,
  command: string | undefined,
} | undefined)[]

type ScriptFieldState = FieldState<ScriptsListArray, ScriptErrors>

export function ProjectScripts() {
  const [ packageJson, setPackageJson ] = usePackageJson()

  const scripts = Object
    .entries(packageJson.scripts ?? {})
    .map<ScriptsListArray[ number ]>(([ name, command ]) => {
      const isUserDefined = !(reservedLifeCycleScripts as readonly string[]).includes(name)
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
            if (value.filter(s => s.name === script.name).length > 1)
              return "Script name must be unique"
            if (script.userDefined && (reservedLifeCycleScripts as readonly string[]).includes(script.name))
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

  const field: ScriptFieldState = useField(scripts, {
    validate: validateUserDefinedScripts,
    onSave: (value) => {
      const newScripts = toScriptObject(value)
      setPackageJson({ scripts: newScripts })
    },
  })

  const userDefinedScriptsValue = field.value.filter(script => script.userDefined)
  const userDefinedScriptsIndices = field.value.map((script, index) => script.userDefined ? index : null).filter(index => index !== null) as number[]
  const userDefinedScriptsErrors = field.error && field.error.filter((_, index) => userDefinedScriptsIndices.includes(index))

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



  return (
    <div className="flex flex-col gap-12 py-4 pb-20">

      <UnsavedActionBar
        isChanged={field.isChanged}
        resettable={field.resettable}
        saveable={field.saveable}
        reset={field.reset}
        save={field.save}
      />

      <div className="flex flex-col gap-6">
        <H2>User Defined Scripts</H2>
        <p className="text-fg-2 -mt-4">
          Define custom scripts that can be run using npm. These scripts can be used for various tasks such as building, testing, or deploying your project.
        </p>
        <UserDefinedScriptInputList
          field={field}
          userValues={userDefinedScriptsValue}
          errors={userDefinedScriptsErrors ?? []}
          onAddScript={addUserDefinedScript}
          onDeleteScript={deleteUserDefinedScript}
          onChangeScript={changeUserDefinedScript}
        />
      </div>

      <div className="flex flex-col gap-6">
        <H2>Lifecycle Script Pipelines</H2>
        <p className="text-fg-2 -mt-4">
          These scripts are predefined by npm and run automatically at specific stages of the package lifecycle. You can customize these scripts to automate tasks such as testing, building, or deploying your project.
        </p>
        <StartScriptInputs field={field} />
        <TestScriptInputs field={field} />
        <InstallScriptInputs field={field} />
        <PublishScriptInputs field={field} />
        <VersionScriptInputs field={field} />
        <PackScriptInputs field={field} />
        <RebuildScriptInputs field={field} />
        <RestartScriptInputs field={field} />
        <StopScriptInputs field={field} />
        <PrepareOnlyScriptInputs field={field} />
      </div>

    </div>
  )
}

const H3 = (props: React.ComponentProps<"h3">) => <h3 className={cn("text text-fg-2", props.className)}>{props.children}</h3>
const H3desc = (props: React.ComponentProps<"p">) => <p className={cn("text-fg-3 text-sm", props.className)}>{props.children}</p>
const ReservedScriptSection = (props: React.ComponentProps<"div">) => <div className={cn("flex flex-col gap-1", props.className)}>{props.children}</div>


function UserDefinedScriptInputList(props: {
  field: FieldState<ScriptsListArray, ScriptErrors>,
  userValues: ScriptsListArray,
  errors: ScriptErrors,
  onAddScript: () => void,
  onDeleteScript: (index: number) => void,
  onChangeScript: (index: number, updater: Updater<{ name: string, command: string }>) => void,
}) {

  const userDefinedValues = props.field.value.filter(script => script.userDefined)
  const userDefinedValueIndices = props.field.value.map((script, index) => script.userDefined ? index : null).filter(index => index !== null)

  const { onDragEnd } = useIndexedReorderDrag({
    value: props.field.value,
    onChange: (_, newIndices) => {
      props.field.setValue(old => {
        const reordered = [ ...old ]
        newIndices.forEach((newIndex, oldIndex) => {
          const oldUserDefinedIndex = userDefinedValueIndices[ oldIndex ]
          const newUserDefinedIndex = userDefinedValueIndices[ newIndex ]
          reordered[ newUserDefinedIndex ] = old[ oldUserDefinedIndex ]
        })
        return reordered
      })
    },
  })

  return <>
    <div className="flex flex-col gap-2">

      {userDefinedValues.map((udScript, index) => {
        return (
          <UserDefinedScriptInput key={index}
            canonicalIndex={userDefinedValueIndices[ index ]}
            field={props.field}
            script={udScript}
            data-drop-id={String(index)}
            onDragEnd={onDragEnd}
          />
        )
      })}

      <InputButton onClick={props.onAddScript}>
        <LucidePlus /> Add Script
      </InputButton>
    </div>
  </>
}

function UnsavedActionBar(props: {
  isChanged: boolean,
  resettable: boolean,
  saveable: boolean,
  reset: () => void,
  save: () => void,
}) {
  return (
    <SomeSortOfConfirmThingWrapper shown={props.isChanged}>
      <SomeSortOfConfirmThing shown={props.isChanged}>
        <div className="flex gap-2">
          <button disabled={!props.resettable} onClick={props.reset}
            className="button py-1.5 px-6 ghost">Discard</button>
          <button disabled={!props.saveable} onClick={props.save}
            className="button py-1.5 px-6">Save</button>
        </div>
      </SomeSortOfConfirmThing>
    </SomeSortOfConfirmThingWrapper>
  )
}


function UserDefinedScriptInput(props: {
  field: FieldState<ScriptsListArray, ScriptErrors>,
  script: ScriptsListArray[ number ],
  canonicalIndex: number,
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void,
  [ "data-drop-id" ]: string,
}) {
  const error = props.field.error && props.field.error[ props.canonicalIndex ] ? props.field.error[ props.canonicalIndex ] : undefined
  const value = props.field.value[ props.canonicalIndex ]
  const onDelete = () => {
    props.field.setValue(old => old.filter((_, i) => i !== props.canonicalIndex))
  }
  const onNameChange = (e: React.ChangeEvent<HTMLInputElement, Element>) => {
    props.field.setValue(old => old.map((s, i) => i === props.canonicalIndex ? { ...s, name: e.target.value } : s))
  }
  const onCommandChange = (e: React.ChangeEvent<HTMLInputElement, Element>) => {
    props.field.setValue(old => old.map((s, i) => i === props.canonicalIndex ? { ...s, command: e.target.value } : s))
  }
  const nameError = typeof error === "object" ? error.name : undefined
  const commandError = typeof error === "object" ? error.command : undefined

  const preCommand = props.field.value.find(s => s.name === `pre${ value.name }`)
  const postCommand = props.field.value.find(s => s.name === `post${ value.name }`)
  const addPreCommand = () => {
    if (preCommand) return
    props.field.setValue(old => [ ...old, { name: `pre${ value.name }`, command: "", userDefined: true } ])
  }
  const addPostCommand = () => {
    if (postCommand) return
    props.field.setValue(old => [ ...old, { name: `post${ value.name }`, command: "", userDefined: true } ])
  }
  const onPreCommandChange = (e: React.ChangeEvent<HTMLInputElement, Element>) => {
    if (!preCommand) return
    props.field.setValue(old => old.map(s => s.name === preCommand.name ? { ...s, command: e.target.value } : s))
  }
  const onPostCommandChange = (e: React.ChangeEvent<HTMLInputElement, Element>) => {
    if (!postCommand) return
    props.field.setValue(old => old.map(s => s.name === postCommand.name ? { ...s, command: e.target.value } : s))
  }
  const onRemovePreCommand = () => {
    if (!preCommand) return
    props.field.setValue(old => old.filter(s => s.name !== preCommand.name))
  }
  const onRemovePostCommand = () => {
    if (!postCommand) return
    props.field.setValue(old => old.filter(s => s.name !== postCommand.name))
  }

  function ArroyTip() {
    return (
      <div className="size-2 rotate-45 -translate-y-[0.075rem] translate-x-[0.07rem] origin-top-right absolute top-4 border-t-2 border-r-2 border-fg-4" />
    )
  }

  function CurveIcon() {
    return (
      <div className="w-6 self-stretch relative flex items-start justify-end">
        <div className="w-2/3 h-4 absolute rounded-bl-lg border-l-2 border-b-2 border-fg-4" />
        <ArroyTip />
      </div>
    )
  }
  function JunctionIcon() {
    return (
      <div className="w-6 self-stretch relative flex items-start justify-end">
        <div className="w-2/3 h-4 absolute rounded-bl-sm border-l-2 border-b-2 border-fg-4" />
        <ArroyTip />
        <div className="w-2/3 h-full absolute border-l-2 border-fg-4" />
      </div>
    )
  }

  return (
    <>
      <InputBlock
        className="starting:opacity-0 transition-opacity duration-250 my-0"
        draggable
        onDragEnd={props.onDragEnd}
        data-drop-id={props[ "data-drop-id" ]}
      >
        <CollectionInputItemGroup
          error={error}
          single
        >
          <SubInput value={value.name}
            Icon={(iconprops) => {
              return <div
                className={cn(iconprops.className, "font-mono flex items-center text-sm pointer-events-none")}
              >npm run
              </div>
            }}
            placeholder="<script name>"
            setLabel="Set Repository URL"
            onSetNotUndefined={() => { }}
            onSetUndefined={onDelete} inputOnChange={onNameChange} error={nameError}
          />

          {/* Command */}
          {preCommand &&
            <SubInput value={preCommand.command}
              Icon={() => {
                return <div className="flex items-center gap-3 font-mono text-sm h-8 text-fg-3/75 italic">
                  <JunctionIcon /> pre:
                </div>
              }}
              placeholder="<pre-script command>"
              onSetNotUndefined={() => { }}
              onSetUndefined={onRemovePreCommand}
              inputOnChange={onPreCommandChange}
              setLabel=""
              clearable={true} error={undefined}
            />
          }
          <SubInput
            Icon={(props) => {
              return (
                postCommand ? <JunctionIcon /> : <CurveIcon />
              )
            }}
            value={value.command}
            placeholder="<script command>"
            setLabel="Set Repository Type"
            inputOnChange={onCommandChange}
            error={commandError}
            clearable={false}
            onSetNotUndefined={() => { }} onSetUndefined={() => { }}
          />
          {postCommand && <SubInput
            Icon={() => {
              return <div className="flex items-center gap-3 font-mono text-sm h-8 text-fg-3/75 italic">
                <CurveIcon />post:
              </div>
            }}
            value={postCommand.command}
            placeholder="<post-script command>"
            onSetNotUndefined={() => { }}
            onSetUndefined={onRemovePostCommand}
            inputOnChange={onPostCommandChange}
            setLabel=""
            clearable={true}
            error={undefined}
          />}
        </CollectionInputItemGroup>
        <InputBlockFooter className="justify-end" expanded={true}>
          <div className="flex">
            {!preCommand &&
              <InputButton disabled={!!preCommand} onClick={addPreCommand} className="h-8 px-4 rounded"  >
                <LucidePlus />
                <span className="font-mono">pre{value.name}</span>
              </InputButton>
            }
            {!postCommand &&
              <InputButton disabled={!!postCommand} onClick={addPostCommand} className="h-8 px-4 rounded">
                <LucidePlus />
                <span className="font-mono">post{value.name}</span>
              </InputButton>
            }
          </div>
        </InputBlockFooter>
      </InputBlock>
    </>
  )
}


function ReservedScriptInput(props: {
  field: FieldState<ScriptsListArray, ScriptErrors>,
  keyword: typeof reservedLifeCycleScripts[ number ],
  addLabel?: React.ReactNode,
  inputLabel?: React.ReactNode,
}) {
  const script = props.field.value.find(function finder(script) {
    const res = script.name === props.keyword
    return res
  })

  const onAddScript = () => { props.field.setValue(old => [ ...old, { name: props.keyword, command: "", userDefined: false } ]) }
  const error = props.field.error && props.field.error.find(function errFinder(_, index) { return typeof props.field.value[ index ] === "object" ? props.field.value[ index ].name === props.keyword : undefined })
  const commandValue = script?.command
  const onCommandChange = (e: React.ChangeEvent<HTMLInputElement, Element>) => {
    props.field.setValue(old => old.map(s => s.name === props.keyword ? { ...s, command: e.target.value } : s))
  }
  const onScriptDelete = () => {
    props.field.setValue(old => {
      return old.filter(s => s.name !== props.keyword)
    })
  }

  return <div className="flex flex-col starting:opacity-0 transition-opacity duration-300">
    <SubInput
      Icon={(iconprops) => {
        return <div
          className={cn(iconprops.className, "font-mono flex items-center text-sm pointer-events-none text-fg-3 w-32 h-8")}
        >{props.inputLabel ?? props.keyword}:</div>
      }}
      value={commandValue}
      placeholder="<script command>"
      onSetNotUndefined={onAddScript}
      onSetUndefined={onScriptDelete}
      inputOnChange={onCommandChange}
      setLabel="set command"
      clearable={true}
      error={typeof error === "object" ? error.command : undefined}
    />
  </div >
}


const reservedLifeCycleScripts = [
  "prepublish", "publish", "postpublish", "prepublishOnly",
  "prepack", "prepare", "postpack", "preprepare", "postprepare",
  "preinstall", "install", "postinstall",
  "preuninstall", "uninstall", "postuninstall",
  "preversion", "version", "postversion",
  "pretest", "test", "posttest",
  "prestop", "stop", "poststop",
  "prestart", "start", "poststart",
  "prerestart", "restart", "postrestart",
] as const

function ReservedScriptPipelineGroup(props: {
  field: FieldState<ScriptsListArray, ScriptErrors>,
  members: (typeof reservedLifeCycleScripts)[ number ][],
  title: React.ReactNode,
  desc: React.ReactNode,
}) {
  return (
    <ReservedScriptSection>
      <header>
        <H3 className="font-mono">{props.title}</H3>
        <H3desc>{props.desc}</H3desc>
      </header>
      <InputBlock>
        <CollectionInputItemGroup className="grow" error={undefined} single>
          {props.members.map(memver => {
            return (
              <ReservedScriptInput key={memver} field={props.field} keyword={memver} inputLabel={memver} />
            )
          })}
        </CollectionInputItemGroup>
      </InputBlock>
      <InputDescription>

      </InputDescription>
    </ReservedScriptSection>
  )
}


function StartScriptInputs(props: {
  field: FieldState<ScriptsListArray, ScriptErrors>,
}) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "prestart", "start", "poststart" ]}
      title="npm start"
      desc="These scripts will be run when you run `npm start` as an entry point to run your program. "
    />
  )
}

function TestScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "pretest", "test", "posttest" ]}
      title="npm test"
      desc="These  scripts will be run when you run `npm test`, a standardized command used by tools and CI."
    />
  )
}

function InstallScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "preinstall", "install", "postinstall", "prepublish", "preprepare", "prepare", "postprepare" ]}
      title="npm install / npm ci"
      desc="These scripts will be run when you run `npm install` to install dependencies or `npm ci` to install dependencies in a deterministic clean state, such as in CI environments."
    />
  )
}

function PublishScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "prepublishOnly", "prepack", "prepare", "postpack", "publish", "postpublish" ]}
      title="npm publish"
      desc="These scripts will be run when you run `npm publish` to publish your package to the npm registry."
    />
  )
}

function VersionScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "preversion", "version", "postversion" ]}
      title="npm version"
      desc="These scripts will be run when you run `npm version` to bump the version of your package."
    />
  )
}

function PackScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "prepack", "prepare", "postpack" ]}
      title="npm pack"
      desc="These scripts will be run when you run `npm pack` to create a tarball of your package."
    />
  )
}

function RebuildScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "preinstall", "install", "postinstall", "prepare" ]}
      title="npm rebuild"
      desc="These scripts will be run when you run `npm rebuild` to rebuild native addons."
    />
  )
}

function RestartScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "prerestart", "restart", "postrestart" ]}
      title="npm restart"
      desc="These scripts will be run when you run `npm restart` to restart your program. If `restart` is not defined, `stop` and `start` (and their `pre` and `post` interations) script will be run instead."
    />
  )
}

function StopScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "prestop", "stop", "poststop" ]}
      title="npm stop"
      desc="These scripts will be run when you run `npm stop` to stop your program."
    />
  )
}

function PrepareOnlyScriptInputs(props: { field: FieldState<ScriptsListArray, ScriptErrors>, }) {
  return (
    <ReservedScriptPipelineGroup
      field={props.field}
      members={[ "prepare" ]}
      title="npm diff / npm cache add"
      desc="The prepare script will be run when you run `npm diff` to see the changes that will be included in the package, or `npm cache add <tarball file>` to add a tarball to the npm cache. This allows you to run build steps and have the built files included in the package without having to commit them to version control."
    />
  )
}




// function PublishingScriptInputSection(props: {
//   field: FieldState<ScriptsListArray, ScriptErrors>,
// }) {
//   return (
//     <>
//       {/* <header>
//         <H3>Publishing Scripts</H3>
//         <H3desc>
//           These scripts are related to the publishing process of the package.
//         </H3desc>
//       </header> */}
//       <ReservedScriptPipelineGroup
//         field={props.field}
//         members={[ "prepublishOnly" ]}
//         whichMemberAsInitiallySet="prepublishOnly"
//         title="PrepublishOnly"
//         desc="Runs before package is prepared and packed only in `npm publish`. This allows running the tests one last time to ensure they're in good shape before publishing, without running them on local `npm install`."
//         scriptLabel="prepublishOnly"
//       >
//         <ReservedScriptInput field={props.field} keyword="prepublishOnly" inputLabel="prepublishOnly" />
//       </ReservedScriptPipelineGroup>








//       <ReservedScriptPipelineGroup
//         field={props.field}
//         members={[ "prepublish" ]}
//         whichMemberAsInitiallySet="prepublish"
//         title="Prepublish"
//         desc="Deprecated. Runs during `npm ci` and `npm install` but not `npm publish`"
//         scriptLabel="prepublish"
//       >
//         <ReservedScriptInput field={props.field} keyword="prepublish" inputLabel="prepublish" />
//       </ReservedScriptPipelineGroup>
//     </>
//   )
// }