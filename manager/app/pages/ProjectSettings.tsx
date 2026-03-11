import React, { startTransition, useEffect, useRef, useState, type ChangeEvent, type ComponentProps, type JSX, type KeyboardEvent, type SetStateAction } from "react"
import { cn } from "lazy-cn"
import { useAsync } from "../../lib/react-async"
import type { MaybePromise } from "bun"
import { checkNPMName } from "../app-fetches"
import { usePackageJson } from "../../features/package-json-client"
import { packageJsonParser } from "../../features/package-json-validations"
import { useUserSettings } from "../../features/user-settings-client"
import { call } from "../app-client"

const H2 = (props: ComponentProps<"h2">) => <h2
  {...props}
  className={cn("text-lg text-fg font-medium sticky top-16 bg-bg z-10 pb-3 -mb-3", props.className)}
  onClick={(e) => {
    window.scrollTo({ top: e.currentTarget.offsetTop - 16, behavior: "smooth" })
  }}
/>

export function ProjectSettings() {

  return <div className="flex flex-col gap-6 py-4">
    <H2>General</H2>
    <ProjectNameInput />
    <ProjectVersionInput />
    <ProjectDescriptionInput />
    <ProjectKeywordsInput />
    <ProjectURLInput />
    <ProjectBugsInput />
    <ProjectLicenseInput />
    <ProjectFundingInput />
    <H2>People</H2>
    <ProjectAuthorInput />
    <ProjectContributorsInput />
  </div>
}

const Label = (props: ComponentProps<"label">) => <label {...props} className={cn("text-xs text-fg-2 px-2 block", props.className)} />
const InputBlock = (props: ComponentProps<"div">) => <div {...props} className={cn("bg-bg-2 p-1 flex flex-col rounded outline-fg-4 focus-within:outline-2 my-2", props.className)} />
const InputBlockFooter = ({ expanded, ...props }: ComponentProps<"div"> & { expanded: boolean }) => <div {...props} className={cn("flex items-baseline gap-2 px-1", expanded ? "py-1" : "", props.className)} />
const InputBlockMessage = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg-3 grow", props.className)} />
const InputDescription = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg-4 hover:text-fg-2 px-2", props.className)} />
const CloseButton = (props: ComponentProps<"button">) => <button {...props} className={cn("button ghost p-1 text-fg-4 hover:text-fg-3", props.className)}><LucideX /></button>

const ErrorMessage = ({ error, ...props }: { error: any } & ComponentProps<"div">) => typeof error !== "string" ? null : <div {...props} className={cn("text-error", props.className)}>{error}</div>
const WarnMessages = (props: { warns: string[] }) => <div className="text-warning/25">{props.warns.map((warn, i) => <div key={i}>{warn}</div>)}</div>
const SuccessMessage = (props: { children?: React.ReactNode }) => <div className="text-success">{props.children}</div>
const LoadingMessage = (props: { children?: React.ReactNode }) => <div className="text-fg-3/75 italic">{props.children}</div>
const Messages = (props: { messages: string[] }) => <div className="text-fg-3/75">{props.messages.map((msg, i) => <div key={i}>{msg}</div>)}</div>
const Input = (props: ComponentProps<"input">) => <input {...props} className={cn("w-full text-fg rounded p-1.5 px-2 font-mono text-sm outline-none placeholder:text-fg-4", props.className)} />
const InputWideButton = (props: ComponentProps<"button">) => <button {...props} className={cn("button ghost text-start hover:bg-bg-3/50 flex items-center gap-1 px-2 py-1.5 grow", props.className)} />
function LucidePlus(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7v14" /></svg>) }
function LucideX(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6L6 18M6 6l12 12" /></svg>) }
function LucideCheck(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 6L9 17l-5-5" /></svg>) }
function LucideUser(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></g></svg>) }

const useField = <T, E>(initialData: T, opts:
  {
    validate: (value: NoInfer<T>, abortSignal: { aborted: boolean }) => MaybePromise<E>,
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
  ),
  deps: any[] = []
) => {
  const [ value, setValue ] = useState(initialData)
  useEffect(() => setValue(initialData), [ JSON.stringify(initialData), ...deps ])

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

  const saveable = isChanged && error === undefined
  const resettable = isChanged
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue((e.target as any).value)
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
    console.log("yeee")
    if (opts.clearable) {
      const newValue = opts.defaultData ? opts.defaultData() : undefined
      setValue(newValue as T)
    }
  }

  // Blur/Editing state
  const [ isFocus, setIsFocus ] = useState(false)
  const isEditing = isFocus || isChanged
  useEffect(() => {
    if (isChanged) {
      setIsFocus(true)
    }
  }, [ isChanged ])

  return {
    value, setValue, isChanged,
    error, warns, isValidating, isCheckingWarns, resetValidate, resetWarns,
    saveable, onChange,
    resettable, reset, exists, clearable: opts.clearable, onClear,
    onSetToNonUndefined,
    isFocus, setIsFocus, isEditing
  } as const
}

const ClearButton = (props: { clearable?: boolean, exists: boolean, onClear: () => void }) => props.clearable && props.exists ? <button onClick={props.onClear} className="button ghost text-xs py-0 text-fg-4 hover:text-fg-3">Clear</button> : null

const BasicField = <T, E>({
  value, onChange, error, warns, saveable, onSave, resettable, reset, label,
  description, renderInput, hideFooter, placeholder, clearable, onClear, exists,
  isChanged, onSetToNonUndefined, isCheckingWarns, isValidating,
  // otherErrors,
  resetValidate, resetWarns, setValue, extraMessages, isFocus, setIsFocus, isEditing, unsetLabel
}: ReturnType<typeof useField<T, E>> & {
  onSave: (value: T) => void,
  label: React.ReactNode,
  unsetLabel?: React.ReactNode,
  description?: React.ReactNode,
  renderInput?: (props: {
    ref: React.Ref<HTMLInputElement>, // focusRef to focus on input element it when clicking on the input block
  }) => React.ReactNode,
  hideFooter?: boolean,
  placeholder?: string,
  extraMessages?: React.ReactNode,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const onInputEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter")
      if (saveable) onSave(value)
  }
  const showSetValueButton = clearable && !exists


  const isInputBlockFooterExpanded =
    !!(error && typeof error === "string") || !!warns.length
    // || !!otherErrors.length
    || !!extraMessages
    || resettable || !!isValidating || !!isCheckingWarns
    || isChanged

  const inputProps = { value, onChange, ref: inputRef, placeholder, onKeyDown: onInputEnter }

  const SetValueButton = (props: { onSetToNonUndefined: () => void }) => <InputWideButton onClick={props.onSetToNonUndefined}><LucidePlus />
    {unsetLabel ?? "Set Value"}
  </InputWideButton>

  return <div
    onFocus={() => {
      if (value === undefined) return
      setIsFocus(true) // somehow doens't work when another button is clicked.
    }}
    onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget))
        setIsFocus(false)
    }}
    tabIndex={0}
  >
    <div className="flex">
      <Label className="grow">{label}</Label>
      <ClearButton clearable={clearable} exists={exists} onClear={onClear} />
    </div>
    <InputBlock
      onClick={() => inputRef.current?.focus()}
      className="group/block"

    >
      {showSetValueButton ?
        <SetValueButton onSetToNonUndefined={onSetToNonUndefined} />
        : renderInput?.(inputProps)
        ?? <Input {...inputProps} value={String(value)} />}
      {hideFooter ? null :
        <InputBlockFooter expanded={isInputBlockFooterExpanded}>
          <InputBlockMessage>
            <ErrorMessage error={error} />
            <WarnMessages warns={warns} />
            {/* <Messages messages={otherErrors} /> */}
            {isValidating ? <LoadingMessage>Validating...</LoadingMessage> :
              isCheckingWarns && <LoadingMessage>Checking...</LoadingMessage>
            }
            {extraMessages}
          </InputBlockMessage>
          {resettable && <button
            disabled={!resettable}
            className="button text-xs ghost" onClick={() => {
              setIsFocus(false)
              reset()
            }}>
            Revert
          </button>}
          {isChanged && <button
            disabled={!saveable}
            className="button text-xs" onClick={() => {
              onSave(value)
              setIsFocus(false)
            }}>
            Save
          </button>}
        </InputBlockFooter>
      }
    </InputBlock>
    {
      // isEditing &&
      true &&
      <InputDescription>
        {description}
      </InputDescription>
    }
  </div>
}



function ProjectNameInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()
  const [ userSettings, updateUserSettings ] = useUserSettings()
  const isCheckAvailEnabled = userSettings.checkProjectNameOnNPM

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
      extraMessages={
        checkResult.status === "idle" ? null :
          checkResult.status === "loading" ? <LoadingMessage>Checking availability on npm...</LoadingMessage> :
            checkResult.status === "error" ? <ErrorMessage error={checkResult.error} /> :
              checkResult.result.status === "disabled" ? null :
                checkResult.result.status === "ok" ? <SuccessMessage>{checkResult.result.message}</SuccessMessage> :
                  checkResult.result.status === "err" ? <ErrorMessage error={checkResult.result.message} /> :
                    checkResult.result.status === "warn" ? <WarnMessages warns={[ checkResult.result.message ]} /> :
                      null

      }
      description={<div className="flex flex-col gap-2">
        The name of the package. If If you don't plan to publish your package, the name and version fields are optional.

        <div className="flex flex-row gap-2 items-center cursor-pointer group"
          onClick={() => updateUserSettings({ checkProjectNameOnNPM: !isCheckAvailEnabled })}
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
      </div>}
    />
  </div>
}


function ProjectVersionInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()
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
      description="The version of the package. If you don't plan to publish your package, 
      the name and version fields are optional."
    />
  </div>
}



function ProjectDescriptionInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()
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
      description="A brief description of the package. Helps people discover your 
      package, as it's listed in `npm search`."
    />
  </div>
}




const StringListInput = (props: Omit<ComponentProps<"input">, 'value' | 'onChange'> & {
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
  const [ packageJson, updatePackageJson ] = usePackageJson()
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
        <StringListInput
          value={field.value ?? []}
          onChange={field.setValue}
        />
      }
      description="An array of keywords that describe the package. Helps people discover 
      your package, as it's listed in `npm search`."
    />
  </div>
}



function ProjectURLInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()
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


function SubInput<T extends string | number | readonly string[] | undefined>(props: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
  value: T | undefined,
  placeholder: string,
  onSetNotUndefined: () => void,
  onSetUndefined: () => void,
  inputOnChange: (e: ChangeEvent<HTMLInputElement>) => void,
  setLabel: React.ReactNode,
  error?: string,
}) {
  return (
    <div className="">
      <div className="flex gap-1 items-center px-2 -ml-1">
        <props.Icon className="text-fg-4 text-lg shrink-0 w-5 h-5" />
        {props.value === undefined ?
          <InputWideButton onClick={props.onSetNotUndefined} className="-mr-2">
            <LucidePlus />{props.setLabel}
          </InputWideButton>
          :
          <>
            <Input className="" placeholder={props.placeholder} value={props.value} onChange={props.inputOnChange} />
            <CloseButton onClick={props.onSetUndefined} />
          </>
        }
      </div>
      <ErrorMessage error={props.error} className="ml-9 text-xs -mt-1" />
    </div>
  )
}
function SubInputFooter(props: ComponentProps<"div">) {
  return <div {...props} className={cn("flex items-center gap-2 px-2 py-1 text-xs", props.className)} />
}



function MaterialSymbolsAlternateEmail(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}<path fill="currentColor" d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12v1.45q0 1.475-1.012 2.513T18.5 17q-.875 0-1.65-.375t-1.3-1.075q-.725.725-1.638 1.088T12 17q-2.075 0-3.537-1.463T7 12t1.463-3.537T12 7t3.538 1.463T17 12v1.45q0 .65.425 1.1T18.5 15t1.075-.45t.425-1.1V12q0-3.35-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20h5v2zm0-7q1.25 0 2.125-.875T15 12t-.875-2.125T12 9t-2.125.875T9 12t.875 2.125T12 15" /></svg>) }
function MingcuteAttachmentLine(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from MingCute Icon by MingCute Design - https://github.com/Richard9394/MingCute/blob/main/LICENSE */}<g fill="none" fillRule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M18.71 17.565a4.25 4.25 0 0 0 0-6.01l-6.54-6.54A1 1 0 0 1 13.584 3.6l6.54 6.54a6.25 6.25 0 1 1-8.838 8.84l-7.954-7.955A4.501 4.501 0 0 1 9.698 4.66l7.953 7.953a2.752 2.752 0 0 1-3.892 3.891L6.513 9.257a1 1 0 0 1 1.414-1.415l7.247 7.247a.751.751 0 0 0 1.063-1.062L8.284 6.074A2.501 2.501 0 0 0 4.746 9.61l7.954 7.954a4.25 4.25 0 0 0 6.01 0Z" /></g></svg>) }

function ProjectBugsInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(packageJson.bugs, {
    validate: packageJsonParser.bugs.validate,
    equalityCheck: packageJsonParser.bugs.isEqual,
    clearable: true,
    defaultData: () => ({}),
  })

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
          <SubInput
            Icon={MingcuteAttachmentLine}
            value={url}
            placeholder="URL"
            onSetNotUndefined={setUrl}
            onSetUndefined={unsetUrl}
            inputOnChange={changeUrl}
            setLabel="Set URL"
            error={typeof field.error === "object" ? field.error.url : undefined}
          />

          <SubInput
            Icon={MaterialSymbolsAlternateEmail}
            value={email}
            placeholder="Email"
            onSetNotUndefined={setEmail}
            onSetUndefined={unsetEmail}
            inputOnChange={changeEmail}
            setLabel="Set email"
            error={typeof field.error === "object" ? field.error.email : undefined}
          />
        </div>}
      description="The URL to the project's issue tracker. If a URL is provided, it will 
      be used by the `npm bugs` command."
    />
  </div>
}



// Requirements:
// - [v] no license means "All rights reserved"
// - [v] error: must uses SPDX license identifier (fetch list)
// - [v] warn: consider using one that are OSI approvied
// - [ ] error: multiple must follow SPDX format (e.g. MIT OR Apache-2.0)
// - [ ] support for custom license file (e.g. "SEE LICENSE IN LICENSE.txt")
// - [ ] only allow max 2 licenses because SPDX format for multiple licenses is hard to parse and validate, and it's uncommon to have more than 2 licenses. If more than 2 licenses are needed, users can use a custom license file.
// - [ ] allow unlicensed

function ProjectLicenseInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const [ licenses, loading ] = useAsync(async (signal) => {
    const res = await call("getValidLicenses")
    if (res.status !== "ok") throw new Error(res.status)
    res.licenses.push({ id: "UNLICENSED", name: "Unlicensed, All rights reserved.", osiApproved: false })
    return res.licenses
  }, [])

  const field = useField(packageJson.license, {
    validate: (value) => packageJsonParser.license.validate(value, licenses.status === "ok" ? licenses.result : undefined),
    defaultData: () => "",
    clearable: true,
  }, [ licenses.status ])

  return <div>
    <BasicField
      {...field}
      label="License"
      onSave={(licensesText) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.license = licensesText
        updatePackageJson(newPackageJson)
      }}
      description="License for the project. Should be a valid SPDX license identifier, e.g. MIT or Apache-2.0 OR MIT."
      extraMessages={
        field.value === undefined ?
          "No license specified means \"All rights reserved\". If your project is unlicensed, set the license to \"UNLICENSED\"." : undefined}
      renderInput={() => {
        return <div>
          <Input
            value={field.value} onChange={(e) => field.setValue(e.currentTarget.value)}
            placeholder="SPDX license identifier, e.g. MIT or Apache-2.0 OR MIT"
            className="peer"
          />
          {/* License List */}
          <div
            data-opened={field.isEditing ? "" : undefined}
            className={cn("relative grid overflow-clip transition-all duration-250 grid-rows-[0fr] data-opened:grid-rows-[1fr]")}>
            <div className="min-h-0">
              <div className="border-t border-t-fg-4 mb-2 mx-1.5" />
              <div className="h-40 px-2 overflow-y-auto flex flex-col">
                {licenses.status === "loading" ? <LoadingMessage>Loading valid licenses...</LoadingMessage> :
                  licenses.status === "error" ? <ErrorMessage error={licenses.error} /> :
                    licenses.status === "ok" ? licenses.result
                      .sort((a, b) => Number(b.osiApproved) - Number(a.osiApproved) || a.id.localeCompare(b.id))
                      .filter(l => field.value === undefined ? true : l.id.toLowerCase().includes(field.value.toLowerCase()) || l.name.toLowerCase().includes(field.value.toLowerCase()))
                      .map((licenses) => {
                        return <button
                          key={licenses.id}
                          className="py-1 hover:bg-bg-3/50 -mx-2 px-2 rounded-sm text-start shrink-0"
                          onClick={() => field.setValue(licenses.id)}
                        >
                          <div className="font-mono text-sm">{licenses.id}
                            {licenses.osiApproved ?
                              <span className="ml-1 text-[0.7rem] font-sans font-medium text-fg-3 bg-bg-3 p-0.5 px-1 leading-4 rounded-md inline-flex items-center">
                                <LucideCheck className="inline mr-0.5" />
                                OSI</span> :
                              null
                            }
                          </div>
                          <div className="text-xs text-fg-3">{licenses.name}</div>
                        </button>
                      }) : null
                }
              </div>
            </div>
          </div>

        </div>
      }}
    />
  </div>
}



function ProjectAuthorInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJsonParser.author.normalize(packageJson.author),
    {
      validate: (value) => packageJsonParser.author.validate(value),
      equalityCheck: packageJsonParser.author.isEqual,
      defaultData: () => ({ name: "" }),
      clearable: true,
    }, [])

  return (
    <div>
      <BasicField
        {...field}
        onSave={(author) => {
          const newPackageJson = { ...packageJson }
          newPackageJson.author = author
          updatePackageJson(newPackageJson)
        }}
        label={"Author"}
        description="The author of the package."
        renderInput={() => {
          return <div className="flex flex-col">
            <SubInput
              Icon={LucideUser}
              value={field.value?.name}
              placeholder="Name"
              onSetNotUndefined={() => field.setValue({ name: "" })}
              onSetUndefined={() => field.setValue(undefined)}
              inputOnChange={(e) => field.setValue({ ...field.value, name: e.target.value } as any)}
              setLabel="Set name"
              error={typeof field.error === "object" ? field.error.name : undefined}
            />
            <SubInput
              Icon={MaterialSymbolsAlternateEmail}
              value={field.value?.email}
              placeholder="Email"
              onSetNotUndefined={() => field.setValue({ ...field.value, email: "" } as any)}
              onSetUndefined={() => field.setValue({ ...field.value, email: undefined } as any)}
              inputOnChange={(e) => field.setValue({ ...field.value, email: e.target.value } as any)}
              setLabel="Set email"
              error={typeof field.error === "object" ? field.error.email : undefined}
            />
            <SubInput
              Icon={MingcuteAttachmentLine}
              value={field.value?.url}
              placeholder="URL"
              onSetNotUndefined={() => field.setValue({ ...field.value, url: "" } as any)}
              onSetUndefined={() => field.setValue({ ...field.value, url: undefined } as any)}
              inputOnChange={(e) => field.setValue({ ...field.value, url: e.target.value } as any)}
              setLabel="Set URL"
              error={typeof field.error === "object" ? field.error.url : undefined}
            />

          </div>
        }}
      />
    </div>
  )
}



function ProjectContributorsInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJsonParser.contributors.normalize(packageJson.contributors), {
    validate: function (value) {
      return packageJsonParser.contributors.validate(value)
    },
    clearable: true,
    defaultData: () => [ { name: "" } ],
  }, [])


  const subinputOnChange = (i: number, key: "name" | "email" | "url", value: string) => {
    field.setValue(field.value?.map((c, idx) => idx === i ? { ...c, [ key ]: value } : c))
  }
  const unsetEmail = (i: number) => field.setValue(field.value?.map((c, idx) => idx === i ? { ...c, email: undefined } : c))
  const unsetUrl = (i: number) => field.setValue(field.value?.map((c, idx) => idx === i ? { ...c, url: undefined } : c))
  const unsetUsername = (i: number) => field.value?.length === 1 ? field.setValue(undefined) : field.setValue(field.value?.filter((_, idx) => idx !== i))

  const addEmail = (i: number) => field.setValue(field.value?.map((c, idx) => idx === i ? { ...c, email: "" } : c))
  const addUrl = (i: number) => field.setValue(field.value?.map((c, idx) => idx === i ? { ...c, url: "" } : c))

  return (
    <BasicField
      onSave={(value) => {
        updatePackageJson({ ...packageJson, contributors: value })
      }}
      label={"Contributors"}
      unsetLabel={"Add contributor"}
      {...field}
      renderInput={() => {
        return <div className="flex flex-col gap-2">
          {field.value?.map((e, i) => {
            const normalized = packageJsonParser.author.normalize(e) ?? { name: "" }
            return <div className="flex flex-col" key={i}>
              <SubInput
                Icon={LucideUser}
                value={normalized.name}
                placeholder="Name"
                onSetNotUndefined={() => { console.log("no-op/unreachable") }}
                onSetUndefined={() => unsetUsername(i)}
                inputOnChange={(ev) => subinputOnChange(i, "name", ev.target.value)}
                setLabel="Set name"
                error={Array.isArray(field.error) && typeof field.error[ i ] === "object" ? field.error[ i ].name : undefined}
              />
              <SubInput
                Icon={MaterialSymbolsAlternateEmail}
                value={normalized.email}
                placeholder="Email"
                onSetNotUndefined={() => addEmail(i)}
                onSetUndefined={() => unsetEmail(i)}
                inputOnChange={(ev) => subinputOnChange(i, "email", ev.target.value)}
                setLabel="Set email"
                error={Array.isArray(field.error) && typeof field.error[ i ] === "object" ? field.error[ i ].email : undefined}
              />
              <SubInput
                Icon={MingcuteAttachmentLine}
                value={normalized.url}
                placeholder="URL"
                onSetNotUndefined={() => addUrl(i)}
                onSetUndefined={() => unsetUrl(i)}
                inputOnChange={(ev) => subinputOnChange(i, "url", ev.target.value)}
                setLabel="Set URL"
                error={Array.isArray(field.error) && typeof field.error[ i ] === "object" ? field.error[ i ].url : undefined}
              />
              <SubInputFooter className="mb-1">
                <ErrorMessage
                  error={Array.isArray(field.error) && typeof field.error[ i ] !== "object" ? field.error[ i ] : undefined} />
              </SubInputFooter>
              <div className="border-t border-t-fg-4 mb-1 mx-1.5" />
            </div>
          })}
          <InputWideButton
            onClick={() => field.setValue([ ...(field.value ?? []), { name: "" } ])}
          >
            <LucidePlus />
            Add Contributor
          </InputWideButton>
        </div>
      }}
    />
  )

}

function ProjectFundingInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJsonParser.funding.normalizeToClient(packageJson.funding), {
    validate: (value) => packageJsonParser.funding.validate(value),
    clearable: true,
    defaultData: () => [],
  }, [])

  return (
    <BasicField
      {...field}
      label={"Funding"}
      onSave={(value) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.funding = packageJsonParser.funding.normalizeToServer(value)
        updatePackageJson(newPackageJson)
      }}
      description="Describes and notifies consumers of a package's monetary support information."
    />
  )
}