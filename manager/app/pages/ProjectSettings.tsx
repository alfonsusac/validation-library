import React, { startTransition, useEffect, useRef, useState, type ChangeEvent, type ComponentProps, type JSX, type KeyboardEvent, type SetStateAction, type SVGProps } from "react"
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
    <ProjectPrivateInput />
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
const InputBlock = (props: ComponentProps<"div">) => <div {...props} className={cn("input-block bg-bg-2 p-1 flex flex-col rounded outline-fg-4 focus-within:outline-2 my-2", props.className)} />
const InputBlockFooter = ({ expanded, ...props }: ComponentProps<"div"> & { expanded: boolean }) => <div {...props} className={cn("input-block-footer flex items-end gap-2 px-1", expanded ? "py-1" : "", props.className)} />
const InputBlockMessage = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg-3 grow", props.className)} />
const InputDescription = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg-4 hover:text-fg-2 px-2", props.className)} />
const CloseButton = (props: ComponentProps<"button">) => <button {...props} className={cn("button ghost p-1 text-fg-4 hover:text-fg-3", props.className)}><LucideX /></button>

const ErrorMessage = ({ error, ...props }: { error: any } & ComponentProps<"div">) => typeof error !== "string" ? null : <div {...props} className={cn("text-error", props.className)}>{error}</div>
const WarnMessages = (props: { warns: string[] }) => <div className="text-warning/25">{props.warns.map((warn, i) => <div key={i}>{warn}</div>)}</div>
const SuccessMessage = (props: { children?: React.ReactNode }) => <div className="text-success">{props.children}</div>
const LoadingMessage = (props: { children?: React.ReactNode }) => <div className="text-fg-3/75 italic">{props.children}</div>
const Messages = (props: { messages: string[] }) => <div className="text-fg-3/75">{props.messages.map((msg, i) => <div key={i}>{msg}</div>)}</div>
const Input = (props: ComponentProps<"input">) => <input {...props} className={cn("input w-full text-fg rounded p-1.5 px-2 font-mono text-sm outline-none placeholder:text-fg-4 h-8", props.className)} />
const InputButton = (props: ComponentProps<"button">) => <button {...props} className={cn("button ghost text-start hover:bg-bg-3/50 flex items-center gap-1 px-2 py-1.5 grow", props.className)} />
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
  resetValidate, resetWarns, setValue, extraMessages, isFocus, setIsFocus, isEditing, setLabel,
  classNames
}: ReturnType<typeof useField<T, E>> & {
  onSave: (value: T) => void,
  label: React.ReactNode,
  setLabel: React.ReactNode,
  description?: React.ReactNode,
  renderInput?: (props: {
    ref?: React.RefObject<HTMLInputElement | null>, // focusRef to focus on input element it when clicking on the input block
  }) => React.ReactNode,
  hideFooter?: boolean,
  placeholder?: string,
  extraMessages?: React.ReactNode,
  classNames?: {
    root?: string,
    label?: string,
    inputBlock?: string,
    input?: string,
    inputButton?: string,
    inputBlockFooter?: string,
    inputBlockMessage?: string,
    inputDescription?: string,
  }
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const onInputEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter")
      if (saveable) onSave(value)
  }
  const showSetValueButton = clearable && !exists

  const isInputBlockFooterExpanded =
    !!(error && typeof error === "string") || !!warns.length
    || !!extraMessages || resettable || !!isValidating || !!isCheckingWarns || isChanged

  const inputProps = { value, onChange, ref: inputRef, placeholder, onKeyDown: onInputEnter }

  const SetValueButton = (props: { onSetToNonUndefined: () => void }) => <InputButton
    className="p-2.5 items-start"
    onClick={props.onSetToNonUndefined}><LucidePlus className="shrink-0 h-[1lh]" />
    <div className="flex flex-col">
      {setLabel ?? "Set Value"}
      <div className="text-xs opacity-75 text-pretty">
        {description}
      </div>
    </div>
  </InputButton>

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
    className={value===undefined ? "-my-3" : ""}
  >
    {value !== undefined &&
      <div className={cn("label flex", classNames?.label)}>
        <Label className="grow">{label}</Label>
        <ClearButton clearable={clearable} exists={exists} onClear={onClear} />
      </div>
    }
    <InputBlock
      className={cn("group/block",
        value === undefined ? "bg-transparent p-0" : "",
        classNames?.inputBlock,)}
    >
      {showSetValueButton ?
        <SetValueButton
          onSetToNonUndefined={() => {
            onSetToNonUndefined()
            setTimeout(() => {
              inputRef.current?.focus()
            }, 0)
          }} />
        : renderInput?.(inputProps)
        ?? <Input {...inputProps} value={String(value)} className={classNames?.input} />}
      {hideFooter ? null :
        <InputBlockFooter
          expanded={isInputBlockFooterExpanded}
          className={cn(classNames?.inputBlockFooter)}
        >
          <InputBlockMessage className={cn(classNames?.inputBlockMessage)}>
            <ErrorMessage error={error} />
            <WarnMessages warns={warns} />
            {isValidating ? <LoadingMessage>Validating...</LoadingMessage> :
              isCheckingWarns && <LoadingMessage>Checking...</LoadingMessage>
            }
            {extraMessages}
          </InputBlockMessage>
          {resettable && <button
            disabled={!resettable}
            className={cn("button text-xs ghost", classNames?.inputButton)} onClick={() => {
              setIsFocus(false)
              reset()
            }}>
            Revert
          </button>}
          {isChanged && <button
            disabled={!saveable}
            className={cn("button text-xs", classNames?.inputButton)}
            onClick={() => {
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
      value !== undefined &&
      <InputDescription className={cn(classNames?.inputDescription)}>
        {description}
      </InputDescription>
    }
  </div>
}

function Switch(props: {
  isOn: boolean,
  onToggle: (newVal: boolean) => void,
  label: React.ReactNode,
  classNames?: {
    root?: string,
    switch?: string,
    switchOn?: string,
    switchOff?: string,
    thumb?: string,
    thumbOn?: string,
    thumbOff?: string,
    label?: string,
  }
}) {
  return (
    <div className={cn("flex flex-row gap-2 items-center cursor-pointer group", props.classNames?.root)}
      onClick={() => props.onToggle(!props.isOn)}
    >
      <div className={cn("rounded-full bg-bg-2 p-1 w-8 transition-[background]",
        props.isOn ? [ "bg-slate-600", props.classNames?.switchOn ] : [ '', props.classNames?.switchOff ],
        props.classNames?.switch
      )}>
        <div className={cn("thumb rounded-full bg-fg-3 w-3 h-3 relative transition-[background,left]",
          props.isOn ? [ " left-3", props.classNames?.thumbOn ] : [ "left-0", props.classNames?.thumbOff ],
          props.classNames?.thumb,
          'bg-slate-400',
        )} />
      </div>
      <div className={cn("text-fg-2 group-hover:text-fg select-none",
        props.classNames?.label
      )}>
        {props.label}
      </div>
    </div>
  )
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
      setLabel="Set Name"
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

        <Switch
          isOn={isCheckAvailEnabled}
          onToggle={(newVal) => updateUserSettings({ checkProjectNameOnNPM: newVal })}
          label="Check Availability on NPM"
        />
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
      setLabel="Set Version"
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
      setLabel="Set Description"
      label="Description"
      onSave={(newDescription) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.description = newDescription
        updatePackageJson(newPackageJson)
      }}
      description="A brief description of the package. Helps people discover your 
      package, as it's listed in 'npm search'."
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
      setLabel="Set Keywords"
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
      setLabel="Set Homepage URL"
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
  renderUndefined?: () => React.ReactNode,
  inputRef?: React.Ref<HTMLInputElement | null>,
}) {
  const ref = useRef<HTMLInputElement>(null)
  // const usedRef = props.inputRef ?? ref
  return (
    <div className="">
      <div className="flex gap-1 items-start px-2 -ml-1">
        <props.Icon className="text-fg-4 text-lg shrink-0 w-5 h-8 " />
        {props.value === undefined ?
          (props.renderUndefined?.() ??
            <InputButton onClick={() => {
              props.onSetNotUndefined()
              setTimeout(() => {
                ref.current?.focus()
              }, 0)
            }} className="-mr-2">
              <LucidePlus />{props.setLabel}
            </InputButton>)
          :
          <>
            <Input ref={(el) => {
              ref.current = el
              if (typeof props.inputRef === "function") {
                return props.inputRef(el)
              } else {
                if (props.inputRef) {
                  props.inputRef.current = el
                }
              }
              return () => {
                ref.current = null
              }
            }} className="" placeholder={props.placeholder} value={props.value} onChange={props.inputOnChange} />
            <CloseButton onClick={props.onSetUndefined} className="h-8 block text-base leading-5 " />
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
function CollectionSeparator(props: ComponentProps<"div">) {
  return <div {...props} className={cn("border-t border-t-fg-4 mb-0 mx-1.5", props.className)} />
}
function AddCollectionItemButton(props: { onClick: () => void, label: React.ReactNode }) {
  return <InputButton
    className="mx-1 mb-1"
    onClick={props.onClick}
  >
    <LucidePlus />
    {props.label}
  </InputButton>
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
      setLabel="Set Bugs URL/Email"
      label="Bugs URL"
      onSave={(bugsUrl) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.bugs = bugsUrl
        updatePackageJson(newPackageJson)
      }}
      renderInput={(props) =>
        <div className="flex flex-col">
          <SubInput
            inputRef={props.ref}
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
      setLabel="Set License"
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
        setLabel="Set Author"
        onSave={(author) => {
          const newPackageJson = { ...packageJson }
          newPackageJson.author = author
          updatePackageJson(newPackageJson)
        }}
        label={"Author"}
        description="The author of the package."
        renderInput={(props) => {
          return <div className="flex flex-col">
            <SubInput
              inputRef={props.ref}
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



function CollectionInput<T extends any[] | undefined, E>(props: {
  field: ReturnType<typeof useField<T, E>>,
  addLabel?: React.ReactNode,
  renderItem: (props: {
    value: T extends any[] ? T[ number ] : never,
    index: number,
    ref: React.RefCallback<HTMLInputElement | null>,
  }) => React.ReactNode,
  defaultItem: () => T extends any[] ? T[ number ] : never,
}) {
  // - Implements auto-focus the last added item
  // - Defines the default item structure for new entries
  // - Style for Input Collection

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  return (
    <div className="flex flex-col gap-2">
      {props.field.value?.map((e, i) => {
        return props.renderItem({
          value: e, index: i, ref: (el) => {
            inputRefs.current[ i ] = el
            return () => { inputRefs.current[ i ] = null }
          }
        })
      })}
      <AddCollectionItemButton onClick={() => {
        const currVal = (props.field.value ?? []) as T
        if (!Array.isArray(currVal)) {
          console.error("InputCollection field value is not an array")
          return
        }
        props.field.setValue([
          ...currVal,
          props.defaultItem()
        ] as T)
        setTimeout(() => {
          if (props.field.value) {
            const lastIndex = props.field.value.length
            inputRefs.current[ lastIndex ]?.focus()
          }
        }, 100)
      }} label={props.addLabel ?? "Add Item"} />
    </div>
  )
}
function CollectionInputItemGroup(props: ComponentProps<"div"> & {
  error: string | object | undefined,
}) {
  return <div {...props} className={cn("flex flex-col", props.className)}>
    {props.children}
    <SubInputFooter className="mb-1">
      <ErrorMessage error={typeof props.error === "string" ? props.error : undefined} />
    </SubInputFooter>
    <CollectionSeparator />
  </div>
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
      setLabel={"Add contributor"}
      {...field}
      renderInput={(prop) => {
        return <CollectionInput
          field={field}
          addLabel={"Add contributor"}
          defaultItem={() => ({ name: "" })}
          renderItem={({ index: i, value: e, ref }) => {
            return <CollectionInputItemGroup key={i}
              error={Array.isArray(field.error) && typeof field.error[ i ] !== "object" ? field.error[ i ] : undefined}
            >
              <SubInput
                Icon={LucideUser}
                value={e.name}
                placeholder="Name"
                onSetNotUndefined={() => { console.log("no-op/unreachable") }}
                onSetUndefined={() => unsetUsername(i)}
                inputOnChange={(ev) => subinputOnChange(i, "name", ev.target.value)}
                setLabel="Set name"
                error={Array.isArray(field.error) && typeof field.error[ i ] === "object" ? field.error[ i ].name : undefined}
                inputRef={i === 0 ? prop.ref : (el) => ref?.(el)}
              />
              <SubInput
                Icon={MaterialSymbolsAlternateEmail}
                value={e.email}
                placeholder="Email"
                onSetNotUndefined={() => addEmail(i)}
                onSetUndefined={() => unsetEmail(i)}
                inputOnChange={(ev) => subinputOnChange(i, "email", ev.target.value)}
                setLabel="Set email"
                error={Array.isArray(field.error) && typeof field.error[ i ] === "object" ? field.error[ i ].email : undefined}
              />
              <SubInput
                Icon={MingcuteAttachmentLine}
                value={e.url}
                placeholder="URL"
                onSetNotUndefined={() => addUrl(i)}
                onSetUndefined={() => unsetUrl(i)}
                inputOnChange={(ev) => subinputOnChange(i, "url", ev.target.value)}
                setLabel="Set URL"
                error={Array.isArray(field.error) && typeof field.error[ i ] === "object" ? field.error[ i ].url : undefined}
              />
            </CollectionInputItemGroup>
          }}
        />
      }}
    />
  )
}


export function LucideLink(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></g></svg>) }
export function LucideExternalLink(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 3h6v6m-11 5L21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>) }
export function CibGithub(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32" {...props}>{/* Icon from CoreUI Brands by creativeLabs Łukasz Holeczek - https://creativecommons.org/publicdomain/zero/1.0/ */}<path fill="currentColor" d="M16 .396c-8.839 0-16 7.167-16 16c0 7.073 4.584 13.068 10.937 15.183c.803.151 1.093-.344 1.093-.772c0-.38-.009-1.385-.015-2.719c-4.453.964-5.391-2.151-5.391-2.151c-.729-1.844-1.781-2.339-1.781-2.339c-1.448-.989.115-.968.115-.968c1.604.109 2.448 1.645 2.448 1.645c1.427 2.448 3.744 1.74 4.661 1.328c.14-1.031.557-1.74 1.011-2.135c-3.552-.401-7.287-1.776-7.287-7.907c0-1.751.62-3.177 1.645-4.297c-.177-.401-.719-2.031.141-4.235c0 0 1.339-.427 4.4 1.641a15.4 15.4 0 0 1 4-.541c1.36.009 2.719.187 4 .541c3.043-2.068 4.381-1.641 4.381-1.641c.859 2.204.317 3.833.161 4.235c1.015 1.12 1.635 2.547 1.635 4.297c0 6.145-3.74 7.5-7.296 7.891c.556.479 1.077 1.464 1.077 2.959c0 2.14-.02 3.864-.02 4.385c0 .416.28.916 1.104.755c6.4-2.093 10.979-8.093 10.979-15.156c0-8.833-7.161-16-16-16z" /></svg>) }
export function CibPatreon(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32" {...props}>{/* Icon from CoreUI Brands by creativeLabs Łukasz Holeczek - https://creativecommons.org/publicdomain/zero/1.0/ */}<path fill="currentColor" d="M20.516.697c-6.355 0-11.521 5.167-11.521 11.521c0 6.333 5.167 11.484 11.521 11.484C26.849 23.702 32 18.551 32 12.218C32 5.863 26.849.697 20.516.697M.005 31.38H5.63V.697H.005z" /></svg>) }
export function CibOpenCollective(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32" {...props}>{/* Icon from CoreUI Brands by creativeLabs Łukasz Holeczek - https://creativecommons.org/publicdomain/zero/1.0/ */}<path fill="currentColor" d="M29.145 6.896a15.9 15.9 0 0 1 0 18.208l-4.129-4.131a10.27 10.27 0 0 0 0-9.947zm-4.041-4.041l-4.131 4.129a10.28 10.28 0 0 0-15.234 9.01c0 3.636 1.916 7 5.047 8.849s7 1.905 10.187.156l4.131 4.145c-4.891 3.391-11.26 3.781-16.531 1.021S-.006 21.941-.006 15.993A16.02 16.02 0 0 1 8.573 1.816a16.01 16.01 0 0 1 16.531 1.021zm4.041 4.041a15.9 15.9 0 0 1 0 18.208l-4.129-4.131a10.27 10.27 0 0 0 0-9.947z" /></svg>) }
export function CibKoFi(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32" {...props}>{/* Icon from CoreUI Brands by creativeLabs Łukasz Holeczek - https://creativecommons.org/publicdomain/zero/1.0/ */}<path fill="currentColor" d="M31.844 11.932c-1.032-5.448-6.48-6.125-6.48-6.125H.964C.156 5.807.057 6.87.057 6.87S-.052 16.637.03 22.637c.22 3.228 3.448 3.561 3.448 3.561s11.021-.031 15.953-.067c3.251-.568 3.579-3.423 3.541-4.98c5.808.323 9.896-3.776 8.871-9.219zm-14.751 4.683c-1.661 1.932-5.348 5.297-5.348 5.297s-.161.161-.417.031c-.099-.073-.14-.12-.14-.12c-.595-.588-4.491-4.063-5.381-5.271c-.943-1.287-1.385-3.599-.119-4.948c1.265-1.344 4.005-1.448 5.817.541c0 0 2.083-2.375 4.625-1.281c2.536 1.095 2.443 4.016.963 5.751m8.23.636c-1.24.156-2.244.036-2.244.036V9.714h2.359s2.631.735 2.631 3.516c0 2.552-1.313 3.557-2.745 4.021z" /></svg>) }

function ProjectFundingInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJsonParser.funding.normalizeToClient(packageJson.funding), {
    validate: (value) => packageJsonParser.funding.validate(value),
    clearable: true,
    defaultData: () => [ { url: "" } ],
  }, [])

  const commonTypeMap = packageJsonParser.funding.commonTypeMap
  const subinputOnChange = (i: number, value: { url?: string, type?: string }) => {
    field.setValue(field.value?.map((c, idx) => idx === i ? { ...c, ...value } : c))
  }
  const onURLChange = (i: number, url: string) => {
    const matchedType = Object.entries(commonTypeMap).find(([ k, v ]) => url.includes(v.match))
    if (matchedType) {
      return subinputOnChange(i, { url, type: matchedType[ 0 ] })
    }
    return subinputOnChange(i, { url })
  }

  const SetTypeButtons: [
    label: string,
    type: string,
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
    defaultUrl: string,
  ][] = [
      [ "GitHub", "github", CibGithub, commonTypeMap[ 'github' ].defaultUrl ],
      [ "Open Collective", "open collective", CibOpenCollective, commonTypeMap[ 'open collective' ].defaultUrl ],
      [ "Patreon", "patreon", CibPatreon, commonTypeMap[ 'patreon' ].defaultUrl ],
      [ "Ko-fi", "ko-fi", CibKoFi, commonTypeMap[ 'ko-fi' ].defaultUrl ],
      [ "Other", "other", LucideExternalLink, "" ],
    ]


  return (
    <BasicField
      {...field}
      label={"Funding"}
      onSave={(value) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.funding = packageJsonParser.funding.normalizeToServer(value)
        updatePackageJson(newPackageJson)
      }}
      setLabel={"Add funding"}
      description="Describes and notifies consumers of a package's monetary support information. This is used by the `npm fund` command to display a summary of where funding is needed in a project's dependency tree."
      renderInput={(prop) => {
        return <CollectionInput
          defaultItem={() => ({ url: "" })}
          field={field}
          addLabel={"Add funding"}
          renderItem={({ index: i, ref, value: e }) => {
            return <CollectionInputItemGroup key={i}
              error={Array.isArray(field.error) && typeof field.error[ i ] !== "object" ? field.error[ i ] : undefined}
            >
              <SubInput
                inputRef={i === 0 ? prop.ref : (el) => { return ref(el) }}
                Icon={LucideLink}
                value={e.url}
                placeholder="URL"
                onSetNotUndefined={() => field.setValue(field.value?.map((f, idx) => idx === i ? { url: "" } : f))}
                onSetUndefined={() => field.value?.length === 1 ? field.setValue(undefined) : field.setValue(field.value?.filter((_, idx) => idx !== i))}
                inputOnChange={(ev) => {
                  const value = ev.target.value
                  onURLChange(i, value)
                }}
                setLabel="Set URL"
                error={Array.isArray(field.error) ? typeof field.error[ i ] === "object" ? field.error[ i ].url : undefined : undefined}
              />
              <SubInput
                Icon={LucideExternalLink}
                value={e.type}
                placeholder="Type"
                onSetNotUndefined={() => subinputOnChange(i, { type: "" })}
                onSetUndefined={() => subinputOnChange(i, { type: undefined })}
                inputOnChange={(ev) => subinputOnChange(i, { type: ev.target.value })}
                setLabel="Set Type"
                renderUndefined={() => {
                  return <div className="flex flex-wrap items-center">
                    <span className="text-fg-2 text-sm ml-2">
                      Set Type:
                    </span>
                    {SetTypeButtons.map(([ label, type, Icon, defaultUrl ]) => (
                      <InputButton key={type} className="grow-0 h-8" onClick={() => { subinputOnChange(i, { type, url: defaultUrl }) }}>
                        <Icon />
                        {label}
                      </InputButton>
                    ))}
                  </div>
                }}
                error={Array.isArray(field.error) ? typeof field.error[ i ] === "object" ? field.error[ i ].type : undefined : undefined}
              />
            </CollectionInputItemGroup>
          }}
        />
      }}
    />
  )
}



export function MaterialSymbolsPublic(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}<path fill="currentColor" d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m-1-2.05V18q-.825 0-1.412-.587T9 16v-1l-4.8-4.8q-.075.45-.137.9T4 12q0 3.025 1.988 5.3T11 19.95m6.9-2.55q1.025-1.125 1.563-2.512T20 12q0-2.45-1.362-4.475T15 4.6V5q0 .825-.587 1.413T13 7h-2v2q0 .425-.288.713T10 10H8v2h6q.425 0 .713.288T15 13v3h1q.65 0 1.175.388T17.9 17.4" /></svg>) }
export function MaterialSymbolsLock(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}<path fill="currentColor" d="M6 22q-.825 0-1.412-.587T4 20V10q0-.825.588-1.412T6 8h1V6q0-2.075 1.463-3.537T12 1t3.538 1.463T17 6v2h1q.825 0 1.413.588T20 10v10q0 .825-.587 1.413T18 22zm6-5q.825 0 1.413-.587T14 15t-.587-1.412T12 13t-1.412.588T10 15t.588 1.413T12 17M9 8h6V6q0-1.25-.875-2.125T12 3t-2.125.875T9 6z" /></svg>) }

function ProjectPrivateInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJson.private, {
    validate: (value) => packageJsonParser.private.validate(value),
    clearable: true,
    defaultData: () => true,
  }, [])

  return (
    <BasicField
      {...field}
      setLabel="Set Visibility"
      classNames={{
        // inputBlock: "bg-transparent py-0"
      }}
      label={"Private"}
      onSave={(value) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.private = value
        updatePackageJson(newPackageJson)
      }}
      description="If true, prevents the package from being accidentally published to the npm registry."
      renderInput={() => {
        return <div className="flex items-center gap-1 p-1">
          {[ false, true ].map((isPrivate, i) => {
            const selected = field.value === isPrivate
            return (
              <div key={i} className={cn("flex flex-col items-start grow p-2 px-3 cursor-pointer text-fg-3 rounded-sm",
                selected ? "text-fg-1 bg-bg-3 " : "hover:bg-bg-3/50 hover:text-fg-2",
                "text-sm"
              )}
                onClick={() => field.setValue(isPrivate)}
              >
                <div className="flex gap-1 items-center">
                  {isPrivate ? <MaterialSymbolsLock /> : <MaterialSymbolsPublic />}
                  {isPrivate ? "Private" : "Public"}
                </div>
                <div className="text-xs opacity-80">
                  {isPrivate ? "Can't be published to npm" : "Can be published to npm"}
                </div>
              </div>
            )
          })}
          {/* <Switch
            isOn={field.value ?? false}
            onToggle={(checked) => field.setValue(checked)}
            label={<div className="font-mono text-sm">{
              field.value ? "Private (not published to npm)" : "Public (published to npm)"
            }</div>}
            classNames={{
              root: "ml-1 my-1",
              switch: "h-6 w-10 rounded-xl",
              switchOff: "bg-bg-3",
              label: "ml-1",
              thumb: "rounded-xl h-4 w-4",
              thumbOn: "left-4"
            }}
          /> */}
        </div>
      }}
    />
  )

}