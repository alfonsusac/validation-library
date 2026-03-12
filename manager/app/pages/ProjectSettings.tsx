import React, { useRef, useState, type ChangeEvent, type ComponentProps, type KeyboardEvent, type SVGProps } from "react"
import { cn } from "lazy-cn"
import { useAsync } from "../../lib/react-async"
import { checkNPMName } from "../app-fetches"
import { usePackageJson } from "../../features/package-json-client"
import { packageJsonParser } from "../../features/package-json-validations"
import { useUserSettings } from "../../features/user-settings-client"
import { call } from "../app-client"
import { CibGithub, CibKoFi, CibOpenCollective, CibPatreon, CollectionInputItemGroup, ErrorMessage, H2, InputBase, InputBlock, InputBlockFooter, InputBlockMessage, InputButton, InputDescription, Label, LoadingMessage, LucideCheck, LucideExternalLink, LucideLink, LucidePlus, LucideTag, LucideUser, MaterialSymbolsAlternateEmail, MaterialSymbolsLock, MaterialSymbolsPublic, MingcuteAttachmentLine, OcticonRelFilePath16, RadixIconsCross2, SubInput, SuccessMessage, useField, WarnMessages } from "../app-ui"

export function ProjectSettings() {

  return <div className="flex flex-col gap-12 py-4">
    <div className="flex flex-col gap-6">
      <H2>General</H2>
      <ProjectNameInput />
      <ProjectVersionInput />
      <ProjectDescriptionInput />
      <ProjectPrivateInput />
      <ProjectKeywordsInput />
      <ProjectLicenseInput />
    </div>
    <div className="flex flex-col gap-6">
      <H2>Links</H2>
      <ProjectURLInput />
      <ProjectBugsInput />
      <ProjectRepositoryInput />
      <ProjectFundingInput />
    </div>
    <div className="flex flex-col gap-6">
      <H2>People</H2>
      <ProjectAuthorInput />
      <ProjectContributorsInput />
    </div>
  </div>
}


const ClearButton = (props: { clearable?: boolean, exists: boolean, onClear: () => void }) => props.clearable && props.exists ? <button onClick={props.onClear} className="button ghost text-xs py-0 text-fg-4 hover:text-fg-3">Clear</button> : null

const BasicField = <T, E>({
  value, onChange, error, warns, saveable, save, resettable, reset, label,
  description, renderInput, hideFooter, placeholder, clearable, onClear, exists,
  isChanged, onSetToNonUndefined, isCheckingWarns, isValidating,
  extraMessages, setIsFocus, setLabel,
  classNames
}: ReturnType<typeof useField<T, E>> & {
  label: React.ReactNode,
  setLabel: React.ReactNode,
  description?: React.ReactNode,
  renderInput?: (props: {
    ref?: React.RefObject<HTMLInputElement | null>, // focusRef to focus on input element it when clicking on the input block
    value: NonNullable<T>,
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
      save()
  }
  const showSetValueButton = clearable && !exists

  const isInputBlockFooterExpanded =
    !!(error && typeof error === "string") || !!warns.length
    || !!extraMessages || resettable || !!isValidating || !!isCheckingWarns || isChanged

  const inputProps = { onChange, ref: inputRef, placeholder, onKeyDown: onInputEnter, value: value as NonNullable<T> }

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
    className={value === undefined ? "-my-3" : ""}
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
        ?? <InputBase {...inputProps} value={String(value)} className={classNames?.input} />}
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
            className={cn("button text-xs ghost", classNames?.inputButton)} onClick={reset}>
            Revert
          </button>}
          {isChanged && <button
            disabled={!saveable}
            className={cn("button text-xs", classNames?.inputButton)}
            onClick={save}>
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
    onSave: (newName) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.name = newName
      updatePackageJson(newPackageJson)
    }
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
    onSave: (newVersion) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.version = newVersion
      updatePackageJson(newPackageJson)
    }
  })
  return <div>
    <BasicField
      {...field}
      setLabel="Set Version"
      label="Version"
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
    defaultData: () => "",
    onSave: (newDescription) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.description = newDescription
      updatePackageJson(newPackageJson)
    }
  })
  return <div>
    <BasicField
      {...field}
      setLabel="Set Description"
      label="Description"
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
        <InputBase
          ref={inputRef}
          value={inputValue} onChange={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={onInputEntered}
          placeholder={props.inputPlaceholder ?? "Add new item..."}
        />
        <button className="button ghost text-xs"
          onClick={() => handleSubmit(inputValue)}
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
    onSave: (newKeywords) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.keywords = newKeywords
      updatePackageJson(newPackageJson)
    }
  })
  return <div>
    <BasicField
      {...field}
      setLabel="Set Keywords"
      label="Keywords"
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
    defaultData: () => "",
    onSave: (newKeywords) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.homepage = newKeywords
      updatePackageJson(newPackageJson)
    }
  })
  return <div>
    <BasicField
      {...field}
      setLabel="Set Homepage URL"
      label="Homepage URL"
      placeholder="https://github.com/npm/example#readme"
      description="The URL to the project homepage."
    />
  </div>
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





function ProjectBugsInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(packageJson.bugs, {
    validate: packageJsonParser.bugs.validate,
    equalityCheck: packageJsonParser.bugs.isEqual,
    clearable: true,
    defaultData: () => ({}),
    onSave: (newBugs) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.bugs = newBugs
      updatePackageJson(newPackageJson)
    }
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
      description="The URL to the project's issue tracker. If a URL is provided, it will 
      be used by the `npm bugs` command."
      renderInput={(props) =>
        <CollectionInputItemGroup single>
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
        </CollectionInputItemGroup>}

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

  const [ licenses, loading ] = useAsync(async () => {
    const res = await call("getValidLicenses")
    if (res.status !== "ok") throw new Error(res.status)
    res.licenses.push({ id: "UNLICENSED", name: "Unlicensed, All rights reserved.", osiApproved: false })
    return res.licenses
  }, [])

  const field = useField(packageJson.license, {
    validate: (value) => packageJsonParser.license.validate(value, licenses.status === "ok" ? licenses.result : undefined),
    defaultData: () => "",
    clearable: true,
    onSave: (newLicense) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.license = newLicense
      updatePackageJson(newPackageJson)
    }
  }, [ licenses.status ])

  return <div>
    <BasicField
      {...field}
      setLabel="Set License"
      label="License"
      description="License for the project. Should be a valid SPDX license identifier, e.g. MIT or Apache-2.0 OR MIT."
      extraMessages={
        field.value === undefined ?
          "No license specified means \"All rights reserved\". If your project is unlicensed, set the license to \"UNLICENSED\"." : undefined}
      renderInput={() => {
        return <div>
          <InputBase
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
      onSave: (newAuthor) => {
        const newPackageJson = { ...packageJson }
        newPackageJson.author = newAuthor
        updatePackageJson(newPackageJson)
      }
    }, [])

  return (
    <div>
      <BasicField
        {...field}
        setLabel="Set Author"
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
    <div className="collection-input flex flex-col gap-1">
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



function ProjectContributorsInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJsonParser.contributors.normalize(packageJson.contributors), {
    validate: function (value) {
      return packageJsonParser.contributors.validate(value)
    },
    clearable: true,
    defaultData: () => [ { name: "" } ],
    onSave: (newContributors) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.contributors = newContributors
      updatePackageJson(newPackageJson)
    }
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



function ProjectFundingInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJsonParser.funding.normalizeToClient(packageJson.funding), {
    validate: (value) => packageJsonParser.funding.validate(value),
    clearable: true,
    defaultData: () => [ { url: "" } ],
    onSave: (newFunding) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.funding = packageJsonParser.funding.normalizeToServer(newFunding)
      updatePackageJson(newPackageJson)
    }
  }, [])

  const commonTypeMap = packageJsonParser.funding.commonTypeMap
  const subinputOnChange = (i: number, value: { url?: string, type?: string }) => {
    field.setValue(field.value?.map((c, idx) => idx === i ? { ...c, ...value } : c))
  }
  const onURLChange = (i: number, url: string) => {
    const matchedType = Object.entries(commonTypeMap).find(([, v ]) => url.includes(v.match))
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




function ProjectPrivateInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJson.private, {
    validate: (value) => packageJsonParser.private.validate(value),
    clearable: true,
    defaultData: () => true,
    onSave: (newPrivate) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.private = newPrivate
      updatePackageJson(newPackageJson)
    }
  }, [])

  return (
    <BasicField
      {...field}
      setLabel="Set Visibility"
      label={"Private"}
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
        </div>
      }}
    />
  )

}



function ProjectRepositoryInput() {
  const [ packageJson, updatePackageJson ] = usePackageJson()

  const field = useField(
    packageJsonParser.repository.normalize(packageJson.repository), {
    validate: (value) => packageJsonParser.repository.validate(value),
    clearable: true,
    defaultData: () => ({ url: "", type: "git" }),
    onSave: (newRepository) => {
      const newPackageJson = { ...packageJson }
      newPackageJson.repository = newRepository
      updatePackageJson(newPackageJson)
    }
  }, [])

  return (
    <BasicField
      {...field}
      description="Information about where the source code for your package lives. This is used by the `npm repo` command to open the package's repository in a web browser."
      label={"Repository"}
      setLabel={"Set Repository"}
      renderInput={(props) => {
        return <CollectionInputItemGroup
          error={undefined}
          single
        >
          <SubInput
            inputRef={props.ref}
            Icon={LucideLink}
            value={field.value?.url}
            placeholder="Link (e.g. github:user/repo)"
            onSetNotUndefined={() => { }}
            onSetUndefined={() => field.setValue(undefined)}
            inputOnChange={(e) => field.setValue({ ...props.value, url: e.target.value })}
            setLabel="Set Repository URL"
            error={typeof field.error === "object" ? field.error.url : undefined}
          />
          <SubInput
            Icon={LucideTag}
            value={field.value?.type}
            placeholder="Type (e.g. git)"
            onSetNotUndefined={() => { }}
            onSetUndefined={() => { }}
            inputOnChange={(e) => field.setValue({ ...props.value, type: e.target.value })}
            setLabel="Set Repository Type"
            clearable={false}
            error={typeof field.error === "object" ? field.error.type : undefined}
          />
          <SubInput
            Icon={OcticonRelFilePath16}
            value={field.value?.directory}
            placeholder="Directory (for monorepos)"
            onSetNotUndefined={() => field.setValue({ ...props.value, directory: "" })}
            onSetUndefined={() => field.setValue({ ...props.value, directory: undefined })}
            inputOnChange={(e) => field.setValue({ ...props.value, directory: e.target.value })}
            setLabel="Set Repository Directory (for monorepos)"
            error={typeof field.error === "object" ? field.error.directory : undefined}
          />
        </CollectionInputItemGroup>
      }}
    />
  )
}