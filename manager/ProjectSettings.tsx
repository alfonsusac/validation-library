import { startTransition, useActionState, useEffect, useRef, useState, type ComponentProps } from "react"
import type { PackageJson } from "./lib/package-json"
import { usePackageJson } from "./App"
import { jsonfetch } from "./lib/fetch"
import { packageJsonParser } from "./lib/validations-package-json"
import { cn } from "lazy-cn"

export function ProjectSettings(props: {
  packageJSON: PackageJson,
}) {
  return <div className="flex flex-col gap-6 py-4">
    <ProjectNameInput />
    <ProjectVersionInput />
    <ProjectDescriptionInput />
    <ProjectKeywordsInput />
  </div>
}

const Label = (props: ComponentProps<"label">) => <label {...props} className={cn("text-xs text-fg2 px-2 block", props.className)} />
const InputBlock = (props: ComponentProps<"div">) => <div {...props} className={cn("bg-bg2 pt-1 flex flex-col rounded outline-fg4 focus-within:outline-2 my-2", props.className)} />
const InputBlockFooter = (props: ComponentProps<"div">) => <div {...props} className={cn("flex items-baseline gap-2 px-2 pb-2", props.className)} />
const InputBlockMessage = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg3 grow", props.className)} />
const InputDescription = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg3 px-2", props.className)} />

const ErrorMessage = (props: { error: string | undefined }) => props.error === undefined ? null : <div className="text-error">{props.error}</div>
const WarnMessages = (props: { warns: string[] }) => <div className="text-warning/25">{props.warns.map((warn, i) => <div key={i}>{warn}</div>)}</div>
const Input = (props: ComponentProps<"input">) => <input {...props} className={cn("w-full text-fg rounded p-2 px-2.5 font-mono text-sm outline-none placeholder:text-fg4", props.className)} />

const useField = <T extends string | string[] | number>(initialData: T, opts: {
  validate: (value: T) => string | undefined,
  warn?: (value: T) => string[],
}) => {
  const [ value, setValue ] = useState(initialData)
  useEffect(() => setValue(initialData), [ JSON.stringify(initialData) ])

  const isChanged = value !== initialData
  const error = opts.validate(value)
  const warns = opts.warn?.(value) || []

  const saveable = isChanged && error === undefined

  const resettable = isChanged

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue((e.target as any).value)
  }

  const reset = () => setValue(initialData)

  return {
    value, setValue, isChanged, error, warns, saveable, onChange, resettable, reset
  } as const
}

const BasicField = <T extends string | number | string[]>({
  value, onChange, error, warns, saveable, onSave, resettable, reset, label, description, renderInput, hideFooter
}: ReturnType<typeof useField<T>> & {
  onSave: (value: T) => void,
  label: React.ReactNode,
  description?: React.ReactNode,
  renderInput?: React.ReactNode,
  hideFooter?: boolean
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  return <>
    <Label>{label}</Label>
    <InputBlock onClick={() => {
      inputRef.current?.focus()
    }}>
      {renderInput ? renderInput :
        <Input value={value} onChange={onChange} ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === "Enter" && saveable) {
              onSave(value)
            }
          }}
        />
      }
      {
        hideFooter ? null :
          <InputBlockFooter>
            <InputBlockMessage>
              <ErrorMessage error={error} />
              <WarnMessages warns={warns} />
            </InputBlockMessage>
            <button
              disabled={!resettable}
              className="button text-xs ghost" onClick={() => reset()}>
              Reset
            </button>
            <button
              disabled={!saveable}
              className="button text-xs" onClick={() => {
                onSave(value)
              }}>
              Save
            </button>
          </InputBlockFooter>
      }
    </InputBlock>
    <InputDescription>{description}</InputDescription>
  </>
}




function ProjectNameInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson(true)
  const field = useField(packageJson.name, {
    validate: (value) => packageJsonParser.name.validate(value, () => false),
    warn: packageJsonParser.name.warn
  })
  const { value: name } = field

  const [ state, dispatch, pending ] = useActionState(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const url = `https://registry.npmjs.org/${ name }`
      const res = await jsonfetch(`https://registry.npmjs.org/${ name }`)
      switch (res.status) {
        case 'error':
          if (res.statusCode === 404) {
            return "available"
          } else {
            console.log("error checking if name exists: ", res.message, url)
            return "error"
          }
        case "fetch error":
          console.log("fetch error checking if name exists: ", res.message, url)
          return "error"
        case "ok":
          if (typeof res.data === 'object' && res.data !== null) {
            if ('_id' in res.data && typeof res.data._id === "string") {
              return "exists"
            }
            console.log("error checking if name exists: unexpected response data", res.data, url)
            return "error"
          }
          console.log("error checking if name exists: unexpected response", res, url)
          return "error"
      }
    }, "idle")

  return <div>
    <BasicField
      {...field}
      label="Name"
      onSave={(newName) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.name = newName
        updatePackageJson(newPackageJson)
      }}
      description={<div className="flex flex-col gap-2">
        The name of the package. If If you don't plan to publish your package, the name and version fields are optional.
        <div className="flex flex-row gap-2 items-baseline bg-transparent outline-none">
          <button className="button text-xs" onClick={() => startTransition(dispatch)}>
            Check
          </button>
          <div className="text-xs">
            {pending === true && <div className="text-fg3">Checking if this name exists on npm...</div>}
            {pending === false && state === "exists" && <div className="text-error">This name is already taken on npm.</div>}
            {pending === false && state === "available" && <div className="text-emerald-500">This name is available on npm.</div>}
            {pending === false && state === "error" && <div className="text-error">There was an error checking if this name exists. Please try again later.</div>}
          </div>
        </div>
      </div>}
    />
  </div>
}

function ProjectVersionInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson(true)
  const field = useField(packageJson.version, {
    validate: (value) => packageJsonParser.version.validate(value),
  })
  return <div>
    <BasicField
      {...field}
      label="Version"
      onSave={(newVersion) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.version = newVersion
        updatePackageJson(newPackageJson)
      }}
      description="The version of the package. If you don't plan to publish your package, the name and version fields are optional."
    />
  </div>
}

function ProjectDescriptionInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson(true)
  const field = useField(packageJson.description ?? "", {
    validate: (value) => packageJsonParser.description.validate(value),
  })
  return <div>
    <BasicField
      {...field}
      label="Description"
      onSave={(newDescription) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.description = newDescription
        updatePackageJson(newPackageJson)
      }}
      description="A brief description of the package. Helps people discover your package, as it's listed in `npm search`."
    />
  </div>
}




function ListInput(props: Omit<ComponentProps<"input">, 'value' | 'onChange'> & {
  value: string[],
  onChange: (value: string[]) => void,
  inputPlaceholder?: string,
}) {
  const [ inputValue, setInputValue ] = useState("")

  function RadixIconsCross2(props: React.SVGProps<SVGSVGElement>) {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 15 15" {...props}>{/* Icon from Radix Icons by WorkOS - https://github.com/radix-ui/icons/blob/master/LICENSE */}<path fill="currentColor" d="M10.969 3.219a.574.574 0 1 1 .812.812L8.313 7.5l3.468 3.469l.074.09a.575.575 0 0 1-.796.796l-.09-.074L7.5 8.312l-3.469 3.47a.574.574 0 1 1-.812-.813L6.688 7.5l-3.47-3.469l-.073-.09a.575.575 0 0 1 .796-.797l.09.075L7.5 6.687z" /></svg>)
  }
  const inputRef = useRef<HTMLInputElement>(null)
  function handleSubmit(e: string) {
    if (e.trim().length === 0) {
      inputRef.current?.focus()
      return
    }
    props.onChange([ ...props.value, e.trim() ])
    setInputValue("")
  }
  function toReorderedArray(arr: string[], from: number, to: number) {
    if (from < 0 || from >= arr.length || to < 0 || to >= arr.length)
      throw new Error("[toReorderedArray]: Index out of bounds")
    const copy = [ ...arr ]
    const [ moved ] = copy.splice(from, 1)
    copy.splice(to, 0, moved)
    return copy
  }
  function handleReorder(from: number, to: number) {
    props.onChange(toReorderedArray(props.value, from, to))
  }
  // using dragEnd method because it works in VSCode's Simple Browser
  function onDragEnd(e: React.DragEvent<HTMLDivElement>) {
    const draggedId = e.currentTarget.id
    const droppedId = document
      .elementsFromPoint(e.clientX, e.clientY)
      .map(el => el.hasAttribute("data-drop-id") ? el.getAttribute("data-drop-id") : null)
      .filter(el => el !== null)[ 0 ]
    console.log(draggedId, droppedId)
    if (draggedId === null || droppedId === null || draggedId === undefined || droppedId === undefined) return
    handleReorder(Number(draggedId), Number(droppedId))
  }
  function onRemoveButtonClicked(index: number) {
    props.onChange(props.value.filter((_, i) => i !== index))
  }
  function onInputEntered(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit(inputValue)
  }

  return (
    <div>
      <div className="px-1 flex gap-2 flex-wrap">
        {props.value.length === 0 && <div className="px-1 font-mono text-xs text-fg3">No items added yet.</div>}
        {props.value.map((v, i) => {
          return <div
            key={i} id={String(i)} draggable={true} data-drop-id={i}
            className="px-1 font-mono text-sm shrink-0 bg-bg3/50 rounded flex flex-row items-center"
            onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()}
          >
            <div>
              <span className="text-fg3/50">"</span>{v}<span className="text-fg3/50">"</span>
            </div>
            <button
              title={`Remove ${ v } form the list`}
              className="button ghost px-1"
              onClick={() => onRemoveButtonClicked(i)}
            >
              <RadixIconsCross2 />
            </button>
          </div>
        })}
      </div>
      <div className="flex">
        <Input
          ref={inputRef}
          value={inputValue} onChange={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={onInputEntered}
          placeholder={props.inputPlaceholder ?? "Add new item..."}
        />
        <button className="button ghost text-xs"
          onClick={(e) => handleSubmit(inputValue)}
        >
          Add
        </button>
      </div>
    </div>
  )

}


function ProjectKeywordsInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson(true)
  const field = useField(packageJson.keywords ?? [], {
    validate: (value) => packageJsonParser.keywords.validate(value),
  })
  return <div>
    <BasicField
      {...field}
      label="Keywords"
      onSave={(newKeywords) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.keywords = newKeywords
        updatePackageJson(newPackageJson)
      }}
      hideFooter={true}
      renderInput={
        <ListInput
          value={field.value}
          onChange={(newValue) => {
            updatePackageJson({
              ...packageJson,
              keywords: newValue
            })
          }}
        />
      }
      description="An array of keywords that describe the package. Helps people discover your package, as it's listed in `npm search`."
    />
  </div>
}