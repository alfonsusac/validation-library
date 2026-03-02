import { useEffect, useRef, useState, type ChangeEvent, type ComponentProps, type KeyboardEvent } from "react"
import { cn } from "lazy-cn"
import { useAsync } from "../../lib/react-async"
import type { MaybePromise } from "bun"
import { checkNPMName, fetchServer } from "../app-fetches"
import { usePackageJson } from "../../features/package-json-client"
import { packageJsonParser } from "../../features/package-json-validations"

export function ProjectSettings() {
  return <div className="flex flex-col gap-6 py-4">
    <ProjectNameInput />
    <ProjectVersionInput />
    <ProjectDescriptionInput />
    <ProjectKeywordsInput />
    <ProjectURLInput />
    <ProjectBugsInput />
    <ProjectLicenseInput />
  </div>
}

const Label = (props: ComponentProps<"label">) => <label {...props} className={cn("text-xs text-fg-2 px-2 block", props.className)} />
const InputBlock = (props: ComponentProps<"div">) => <div {...props} className={cn("bg-bg-2 p-1 flex flex-col rounded outline-fg-4 focus-within:outline-2 my-2", props.className)} />
const InputBlockFooter = (props: ComponentProps<"div">) => <div {...props} className={cn("flex items-baseline gap-2 p-1", props.className)} />
const InputBlockMessage = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg-3 grow", props.className)} />
const InputDescription = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg-3 px-2", props.className)} />

const ErrorMessage = (props: { error: string | undefined }) => props.error === undefined ? null : <div className="text-error">{props.error}</div>
const WarnMessages = (props: { warns: string[] }) => <div className="text-warning/25">{props.warns.map((warn, i) => <div key={i}>{warn}</div>)}</div>
const SuccessMessage = (props: { children?: React.ReactNode }) => <div className="text-success">{props.children}</div>
const LoadingMessage = (props: { children?: React.ReactNode }) => <div className="text-fg-3/75 italic">{props.children}</div>
const Messages = (props: { messages: string[] }) => <div className="text-fg-3/75">{props.messages.map((msg, i) => <div key={i}>{msg}</div>)}</div>
const Input = (props: ComponentProps<"input">) => <input {...props} className={cn("w-full text-fg rounded p-1.5 px-2 font-mono text-sm outline-none placeholder:text-fg-4", props.className)} />
const InputWideButton = (props: ComponentProps<"button">) => <button {...props} className={cn("button ghost text-start hover:bg-bg-3/50 flex items-center gap-1 px-2 py-1.5 grow", props.className)} />
// function RadixIconsPlus(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 15 15" {...props}>{/* Icon from Radix Icons by WorkOS - https://github.com/radix-ui/icons/blob/master/LICENSE */}<path fill="currentColor" fillRule="evenodd" d="M8 2.75a.5.5 0 0 0-1 0V7H2.75a.5.5 0 0 0 0 1H7v4.25a.5.5 0 0 0 1 0V8h4.25a.5.5 0 0 0 0-1H8z" clipRule="evenodd" /></svg>) }
function LucidePlus(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7v14" /></svg>) }
function LucideX(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6L6 18M6 6l12 12" /></svg>) }

const useField = <T extends any>(initialData: T, opts:
  {
    validate: (value: NoInfer<T>, abortSignal: { aborted: boolean }) => MaybePromise<string | undefined>,
    warn?: (value: NoInfer<T>, abortSignal: { aborted: boolean }) => MaybePromise<string[]>,
    placeholder?: string,
    equalityCheck?: (a: NoInfer<T>, b: NoInfer<T>) => boolean,
  } & (
    undefined extends NoInfer<T> ? {
      clearable: boolean,
      defaultData: () => NoInfer<T>
    } : {
      clearable?: undefined,
      defaultData?: undefined
    }
  )
) => {
  const [ value, setValue ] = useState(initialData)
  useEffect(() => setValue(initialData), [ JSON.stringify(initialData) ])

  // isChanged logic
  const isChanged = opts.equalityCheck?.(value, initialData) ??
    (typeof value === "object" && value !== null) ?
    (JSON.stringify(value) !== JSON.stringify(initialData)) :
    value !== initialData

  // error and warn logic
  const [ errorRes, isValidating, resetValidate ] = useAsync(async (signal) => { return await opts.validate(value, signal) }, [ value ])
  const [ warnsRes, isCheckingWarns, resetWarns ] = useAsync(async (signal) => { return await opts.warn?.(value, signal) || [] }, [ value ])
  const error = errorRes.status === "ok" ? errorRes.result : undefined
  const warns = warnsRes.status === "ok" ? warnsRes.result : []

  const otherErrors: string[] = []
  if (errorRes.status === 'error') otherErrors.push(error ?? "Unknown Error validating the field")
  if (warnsRes.status === 'error') otherErrors.push(...warns)

  const saveable = isChanged && error === undefined
  const resettable = isChanged
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue((e.target as any).value)
    // only sets value of the state.
    // if no need to use (e), just call setValue directly.
  }
  const reset = () => setValue(initialData)

  // Undefined behavior
  if (opts.clearable === true && opts.defaultData === undefined) {
    const err = new Error("If clearable is true, defaultData must be provided")
    Error.captureStackTrace?.(err, useField)
    throw err
  }
  const exists = value === undefined ? false : true
  const onClear = () => {
    if (opts.clearable) {
      setValue(undefined as T)
    }
  }
  const onSetToNonUndefined = () => {
    if (opts.clearable) {
      const newValue = opts.defaultData ? opts.defaultData() : undefined
      setValue(newValue as T)
    }
  }

  return {
    value, setValue, isChanged,
    error, warns, isValidating, isCheckingWarns, resetValidate, resetWarns,
    saveable, onChange,
    resettable, reset, exists, clearable: opts.clearable, onClear,
    onSetToNonUndefined, otherErrors,
  } as const
}

const BasicField = <T,>({
  value, onChange, error, warns, saveable, onSave, resettable, reset, label,
  description, renderInput, hideFooter, placeholder, clearable, onClear, exists,
  isChanged, onSetToNonUndefined, isCheckingWarns, isValidating, otherErrors,
  resetValidate, resetWarns, setValue, extraMessages
}: ReturnType<typeof useField<T>> & {
  onSave: (value: T) => void,
  label: React.ReactNode,
  description?: React.ReactNode,
  renderInput?: (props: {
    ref: React.Ref<HTMLInputElement>, // focusRef to focus on input element it when clicking on the input block
  }) => React.ReactNode,
  hideFooter?: boolean,
  placeholder?: string,
  extraMessages?: React.ReactNode,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const clearButton = <button onClick={onClear} className="button ghost text-xs py-0 text-fg-4 hover:text-fg-3">
    Clear
    {/* Delete */}
  </button>

  const onInputEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter")
      if (saveable) onSave(value)
  }
  const inputProps = {
    value, onChange, ref: inputRef, placeholder, onKeyDown: onInputEnter
  }


  return <>
    <div className="flex">
      <Label className="grow">
        {label}
      </Label>
      {clearable && exists ? clearButton : null}
    </div>
    <InputBlock onClick={() => inputRef.current?.focus()}>
      {
        (clearable && !exists) ?
          <InputWideButton onClick={onSetToNonUndefined}>
            <LucidePlus />
            Set value
          </InputWideButton>
          : renderInput ?
            renderInput(inputProps)
            : <Input {...inputProps} value={String(value)} />
      }
      {
        hideFooter ? null :
          <InputBlockFooter>
            <InputBlockMessage>
              <ErrorMessage error={error} />
              <WarnMessages warns={warns} />
              <Messages messages={otherErrors} />
              {
                isValidating ? <LoadingMessage>Validating...</LoadingMessage> :
                  isCheckingWarns && <LoadingMessage>Checking...</LoadingMessage>
              }
              {extraMessages}
            </InputBlockMessage>
            <button
              disabled={!resettable}
              className="button text-xs ghost" onClick={() => reset()}>
              Revert
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
  const { packageJson, updatePackageJson } = usePackageJson(true)
  const [ isCheckAvailEnabled, setIsCheckAvailEnabled ] = useState(false)
  const field = useField(packageJson.name, {
    validate: (value) => packageJsonParser.name.validate(value, () => false),
    warn: packageJsonParser.name.warn,
  })
  const name = field.value


  const [ checkResult, isLoading, resetCheck ] = useAsync(async signal => {
    if (!isCheckAvailEnabled) return { status: "disabled" as const }
    if (field.error) return { status: "disabled" as const }
    await new Promise(resolve => setTimeout(resolve, 250))
    if (signal.aborted) return { status: "disabled" as const }
    const res = await checkNPMName(name)
    if (res === "available") return { status: "ok" as const, message: `${ name } is available on npm` }
    if (res === "exists") return { status: "err" as const, message: `${ name } is already taken on npm` }
    if (res === "fetch error") return { status: "warn" as const, message: `Error checking ${ name } on npm. Unable to fetch.` }
    if (res === "malformed json") return { status: "warn" as const, message: `Error checking ${ name } on npm. Unable to read json.` }
    if (res === "unexpected response data") return { status: "warn" as const, message: `Error checking ${ name } on npm. Unexpected response data.` }
    if (res === "unexpected server response") return { status: "warn" as const, message: `Error checking ${ name } on npm. Unexpected response.` }
    return { status: "warn" as const, message: `Error checking ${ name } on npm. Unknown error.` }
  }, [ name, field.error, isCheckAvailEnabled ])

  return <div>
    <BasicField
      {...field}
      label="Name"
      onSave={(newName) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.name = newName
        updatePackageJson(newPackageJson)
      }}
      placeholder="my-package"
      extraMessages={<>
        {
          checkResult.status === "idle" ? null :
            checkResult.status === "loading" ? <LoadingMessage>Checking availability on npm...</LoadingMessage> :
              checkResult.status === "error" ? <ErrorMessage error={checkResult.error} /> :
                checkResult.result.status === "disabled" ? null :
                  checkResult.result.status === "ok" ? <SuccessMessage>{checkResult.result.message}</SuccessMessage> :
                    checkResult.result.status === "err" ? <ErrorMessage error={checkResult.result.message} /> :
                      checkResult.result.status === "warn" ? <WarnMessages warns={[ checkResult.result.message ]} /> :
                        null
        }
      </>}
      description={<div className="flex flex-col gap-2">
        The name of the package. If If you don't plan to publish your package, the name and version fields are optional.

        <div className="flex flex-row gap-2 items-center cursor-pointer group"
          onClick={() => setIsCheckAvailEnabled(v => !v)}
        >
          <div className={cn("rounded-full bg-bg-2 p-1 w-8 transition-[background]",
            isCheckAvailEnabled ? "bg-slate-600" : ""
          )}>
            <div className={cn("rounded-full bg-fg-3 w-3 h-3 relative transition-[background,left]",
              isCheckAvailEnabled ? "bg-slate-200 left-3" : "left-0"
            )} />
          </div>
          <div className="text-fg-2 group-hover:text-fg">
            Check Availability on NPM
          </div>
        </div>
        {/* <div className="flex flex-row gap-2 items-baseline">
          <button className="button text-xs" onClick={() => startTransition(dispatch)}>
            Check
          </button>
          <div className="text-xs">
            {pending === true && <div className="text-fg-3">Checking if this name exists on npm...</div>}
            {pending === false && state === "exists" && <div className="text-error">"{field.value}" is already taken on npm.</div>}
            {pending === false && state === "available" && <div className="text-success">"{field.value}" is available on npm.</div>}
            {pending === false && state === "error" && <div className="text-error">There was an error checking if this name exists. Please try again later.</div>}
          </div>
        </div> */}
      </div>}
    />
  </div>
}

function ProjectVersionInput() {
  const { packageJson, updatePackageJson } = usePackageJson(true)
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
  const { packageJson, updatePackageJson } = usePackageJson(true)
  const field = useField(packageJson.description, {
    validate: (value) => packageJsonParser.description.validate(value),
    clearable: true,
    defaultData: () => ""
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




const ListInput = (props: Omit<ComponentProps<"input">, 'value' | 'onChange'> & {
  value: string[],
  onChange: (value: string[]) => void,
  inputPlaceholder?: string,
}) => {
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
      <div className="flex gap-2 flex-wrap p-1">
        {props.value.length === 0 && <div className="px-1 font-mono text-xs text-fg-3">No items added yet.</div>}
        {props.value.map((v, i) => {
          return <div
            key={i} id={String(i)} draggable={true} data-drop-id={i}
            className="px-1 font-mono text-sm shrink-0 bg-bg-3/50 rounded flex flex-row items-center"
            onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()}
          >
            <div>
              <span className="text-fg-3/50">"</span>{v}<span className="text-fg-3/50">"</span>
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
  const { packageJson, updatePackageJson } = usePackageJson(true)
  const field = useField(packageJson.keywords, {
    validate: (value) => packageJsonParser.keywords.validate(value),
    clearable: true,
    defaultData: () => [],
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
      renderInput={() =>
        <ListInput
          value={field.value ?? []}
          onChange={field.setValue}
        />
      }
      description="An array of keywords that describe the package. Helps people discover your package, as it's listed in `npm search`."
    />
  </div>
}

function ProjectURLInput() {
  const { packageJson, updatePackageJson } = usePackageJson(true)
  const field = useField(packageJson.homepage, {
    validate: (value) => packageJsonParser.homepage.validate(value),
    clearable: true,
    defaultData: () => ""
  })
  return <div>
    <BasicField
      {...field}
      label="Homepage URL"
      placeholder="https://github.com/npm/example#readme"
      onSave={(newKeywords) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.homepage = newKeywords
        updatePackageJson(newPackageJson)
      }}
      description="The URL to the project homepage."
    />
  </div>
}

function ProjectBugsInput() {
  const { packageJson, updatePackageJson } = usePackageJson(true)
  const field = useField(packageJson.bugs, {
    validate: (value) => packageJsonParser.bugs.validate(value),
    clearable: true,
    defaultData: () => ({}),
    equalityCheck: (a, b) => {
      if (typeof a === "string" && typeof b === "string")
        return a === b
      if (typeof a === "object" && a !== null && typeof b === "object" && b !== null)
        return a.url === b.url && a.email === b.email
      if (typeof a === "string" && typeof b === "object" && 'url' in b && typeof b.url === "string")
        return a === b.url
      if (typeof b === "string" && typeof a === "object" && 'url' in a && typeof a.url === "string")
        return a.url === b
      else
        return a === b
    }
  })

  function MaterialSymbolsAlternateEmail(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}<path fill="currentColor" d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12v1.45q0 1.475-1.012 2.513T18.5 17q-.875 0-1.65-.375t-1.3-1.075q-.725.725-1.638 1.088T12 17q-2.075 0-3.537-1.463T7 12t1.463-3.537T12 7t3.538 1.463T17 12v1.45q0 .65.425 1.1T18.5 15t1.075-.45t.425-1.1V12q0-3.35-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20h5v2zm0-7q1.25 0 2.125-.875T15 12t-.875-2.125T12 9t-2.125.875T9 12t.875 2.125T12 15" /></svg>) }
  function MingcuteAttachmentLine(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from MingCute Icon by MingCute Design - https://github.com/Richard9394/MingCute/blob/main/LICENSE */}<g fill="none" fillRule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M18.71 17.565a4.25 4.25 0 0 0 0-6.01l-6.54-6.54A1 1 0 0 1 13.584 3.6l6.54 6.54a6.25 6.25 0 1 1-8.838 8.84l-7.954-7.955A4.501 4.501 0 0 1 9.698 4.66l7.953 7.953a2.752 2.752 0 0 1-3.892 3.891L6.513 9.257a1 1 0 0 1 1.414-1.415l7.247 7.247a.751.751 0 0 0 1.063-1.062L8.284 6.074A2.501 2.501 0 0 0 4.746 9.61l7.954 7.954a4.25 4.25 0 0 0 6.01 0Z" /></g></svg>) }

  const CloseButton = (props: ComponentProps<"button">) => <button {...props} className={cn("button ghost p-1 text-fg-4 hover:text-fg-3", props.className)}>
    <LucideX />
  </button>

  const url = typeof field.value === "string" ? field.value : field.value?.url
  const email = typeof field.value === "string" ? undefined : field.value?.email

  const changeUrl = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => field.setValue({ url: e.target.value, email })
  const changeEmail = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => field.setValue({ url, email: e.target.value })
  const unsetUrl = () => field.setValue(email === undefined ? undefined : { url: undefined, email })
  const unsetEmail = () => field.setValue(url === undefined ? undefined : { url, email: undefined })
  const setUrl = () => field.setValue({ url: "", email })
  const setEmail = () => field.setValue({ url, email: "" })

  return <div>
    <BasicField
      {...field}
      label="Bugs URL"
      onSave={(bugsUrl) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.bugs = bugsUrl
        updatePackageJson(newPackageJson)
      }}
      renderInput={() =>
        <div className="flex flex-col">

          <div className="flex gap-1 items-center px-2">
            <MingcuteAttachmentLine className="text-fg-4 text-lg shrink-0" />
            {url === undefined ?
              <InputWideButton onClick={setUrl}>
                <LucidePlus />Set URL
              </InputWideButton>
              :
              <>
                <Input className="" placeholder="url" value={url} onChange={changeUrl} />
                <CloseButton onClick={unsetUrl} />
              </>
            }
          </div>

          <div className="flex gap-1 items-center px-2">
            <MaterialSymbolsAlternateEmail className="text-fg-4 text-lg shrink-0" />
            {email === undefined ?
              <InputWideButton onClick={setEmail}>
                <LucidePlus />Set email
              </InputWideButton>
              :
              <>
                <Input className="" placeholder="email" value={email} onChange={changeEmail} />
                <CloseButton onClick={unsetEmail} />
              </>
            }
          </div>
        </div>}
      description="The URL to the project's issue tracker. If a URL is provided, it will be used by the `npm bugs` command."
    />
  </div>
}


// Requirements:
// - [ ] no license means "All rights reserved"
// - [ ] error: must uses SPDX license identifier (fetch list)
// - [ ] warn: consider using one that are OSI approvied
// - [ ] error: multiple must follow SPDX format (e.g. MIT OR Apache-2.0)
// - [ ] support for custom license file (e.g. "SEE LICENSE IN LICENSE.txt")
// - [ ] only allow max 2 licenses because SPDX format for multiple licenses is hard to parse and validate, and it's uncommon to have more than 2 licenses. If more than 2 licenses are needed, users can use a custom license file.
// - [ ] allow unlicensed

function ProjectLicenseInput() {
  const [ val, setVal ] = useState("")

  const [ delayedVal, loading, reset ] = useAsync(async (signal) => {
    if (val === "") return "ok" // no license means "All rights reserved", which is valid
    // await new Promise(resolve => setTimeout(resolve, Math.random() * 2500))
    if (signal.aborted) throw 0
    const res = await fetchServer("GET:/sdpx-licenses")
    return res.map((license) => license.id).includes(val) ? "ok" : "license not found in SPDX list"
  }, [ val ])

  return <div>
    <Label>License</Label>
    <InputBlock>
      <Input
        value={val} onChange={(e) => setVal(e.currentTarget.value)}
        placeholder="SPDX license identifier, e.g. MIT or Apache-2.0 OR MIT" />
      <InputBlockFooter>
        <InputBlockMessage>
          {delayedVal.status === "ok" ? delayedVal.result :
            delayedVal.status === "error" ? `Error: ${ delayedVal.error }` :
              delayedVal.status === "loading" ? "Checking..." :
                "Type a license to see validation result here."
          }
        </InputBlockMessage>

      </InputBlockFooter>
    </InputBlock>
  </div>


}