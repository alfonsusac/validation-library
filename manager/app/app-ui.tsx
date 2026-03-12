import { cn } from "lazy-cn"
import { useEffect, useRef, useState, type ChangeEvent, type ComponentProps, type SVGProps } from "react"
import { useAsync } from "../lib/react-async"
import type { MaybePromise } from "bun"

export function H2(props: ComponentProps<"h2">) {
  return <h2
    {...props}
    className={cn("text-lg text-fg font-medium sticky top-16 bg-bg z-10 pb-3 -mb-3 -translate-y-px", props.className)}
    onClick={(e) => {
      console.log("scrolling to", e.currentTarget.offsetTop)
      window.scrollTo({ top: e.currentTarget.offsetTop - 16, behavior: "smooth" })
    }}
  />
}


export const Label = (props: ComponentProps<"label">) => <label {...props} className={cn("text-xs text-fg-2 px-2 block", props.className)} />
export const InputBlock = (props: ComponentProps<"div">) => <div {...props} className={cn("input-block bg-bg-2 p-1 flex flex-col rounded outline-fg-4 focus-within:outline-2 my-2", props.className)} />
export const InputBlockFooter = ({ expanded, ...props }: ComponentProps<"div"> & { expanded: boolean }) => <div {...props} className={cn("input-block-footer flex items-end gap-2 px-1", expanded ? "py-1" : "", props.className)} />
export const InputBlockMessage = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg-3 grow", props.className)} />
export const InputDescription = (props: ComponentProps<"div">) => <div {...props} className={cn("text-xs text-fg-4 hover:text-fg-2 px-2", props.className)} />
export const InputBox = (props: ComponentProps<"div">) => <div {...props} className={cn("input-box gap-1 items-start", props.className)} />
export const InputBase = (props: ComponentProps<"input">) => <input {...props} className={cn("input w-full text-fg rounded p-1.5 px-2 font-mono text-sm outline-none placeholder:text-fg-4 h-8", props.className)} />
export const InputButton = (props: ComponentProps<"button">) => <button {...props} className={cn("input-button button ghost text-start hover:bg-bg-3/50 flex items-center gap-1 px-1.5 py-1.5 grow", props.className)} />
export const InputStartIcon = (props: ComponentProps<"div">) => <div {...props} className={cn("text-fg-4 shrink-0 w-4.5 ml-1 h-8 ml-1", props.className)} />
export const ErrorMessage = ({ error, ...props }: { error: any } & ComponentProps<"div">) => typeof error !== "string" ? null : <div {...props} className={cn("text-error", props.className)}>{error}</div>
export const WarnMessages = (props: { warns: string[] }) => <div className="text-warning/25">{props.warns.map((warn, i) => <div key={i}>{warn}</div>)}</div>
export const SuccessMessage = (props: { children?: React.ReactNode }) => <div className="text-success">{props.children}</div>
export const LoadingMessage = (props: { children?: React.ReactNode }) => <div className="text-fg-3/75 italic">{props.children}</div>

export function LucidePlus(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7v14" /></svg>) }
export function LucideX(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6L6 18M6 6l12 12" /></svg>) }
export function LucideCheck(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 6L9 17l-5-5" /></svg>) }
export function LucideUser(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></g></svg>) }
export function LucideLink(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></g></svg>) }
export function LucideExternalLink(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 3h6v6m-11 5L21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>) }
export function CibGithub(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32" {...props}>{/* Icon from CoreUI Brands by creativeLabs Łukasz Holeczek - https://creativecommons.org/publicdomain/zero/1.0/ */}<path fill="currentColor" d="M16 .396c-8.839 0-16 7.167-16 16c0 7.073 4.584 13.068 10.937 15.183c.803.151 1.093-.344 1.093-.772c0-.38-.009-1.385-.015-2.719c-4.453.964-5.391-2.151-5.391-2.151c-.729-1.844-1.781-2.339-1.781-2.339c-1.448-.989.115-.968.115-.968c1.604.109 2.448 1.645 2.448 1.645c1.427 2.448 3.744 1.74 4.661 1.328c.14-1.031.557-1.74 1.011-2.135c-3.552-.401-7.287-1.776-7.287-7.907c0-1.751.62-3.177 1.645-4.297c-.177-.401-.719-2.031.141-4.235c0 0 1.339-.427 4.4 1.641a15.4 15.4 0 0 1 4-.541c1.36.009 2.719.187 4 .541c3.043-2.068 4.381-1.641 4.381-1.641c.859 2.204.317 3.833.161 4.235c1.015 1.12 1.635 2.547 1.635 4.297c0 6.145-3.74 7.5-7.296 7.891c.556.479 1.077 1.464 1.077 2.959c0 2.14-.02 3.864-.02 4.385c0 .416.28.916 1.104.755c6.4-2.093 10.979-8.093 10.979-15.156c0-8.833-7.161-16-16-16z" /></svg>) }
export function CibPatreon(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32" {...props}>{/* Icon from CoreUI Brands by creativeLabs Łukasz Holeczek - https://creativecommons.org/publicdomain/zero/1.0/ */}<path fill="currentColor" d="M20.516.697c-6.355 0-11.521 5.167-11.521 11.521c0 6.333 5.167 11.484 11.521 11.484C26.849 23.702 32 18.551 32 12.218C32 5.863 26.849.697 20.516.697M.005 31.38H5.63V.697H.005z" /></svg>) }
export function CibOpenCollective(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32" {...props}>{/* Icon from CoreUI Brands by creativeLabs Łukasz Holeczek - https://creativecommons.org/publicdomain/zero/1.0/ */}<path fill="currentColor" d="M29.145 6.896a15.9 15.9 0 0 1 0 18.208l-4.129-4.131a10.27 10.27 0 0 0 0-9.947zm-4.041-4.041l-4.131 4.129a10.28 10.28 0 0 0-15.234 9.01c0 3.636 1.916 7 5.047 8.849s7 1.905 10.187.156l4.131 4.145c-4.891 3.391-11.26 3.781-16.531 1.021S-.006 21.941-.006 15.993A16.02 16.02 0 0 1 8.573 1.816a16.01 16.01 0 0 1 16.531 1.021zm4.041 4.041a15.9 15.9 0 0 1 0 18.208l-4.129-4.131a10.27 10.27 0 0 0 0-9.947z" /></svg>) }
export function CibKoFi(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32" {...props}>{/* Icon from CoreUI Brands by creativeLabs Łukasz Holeczek - https://creativecommons.org/publicdomain/zero/1.0/ */}<path fill="currentColor" d="M31.844 11.932c-1.032-5.448-6.48-6.125-6.48-6.125H.964C.156 5.807.057 6.87.057 6.87S-.052 16.637.03 22.637c.22 3.228 3.448 3.561 3.448 3.561s11.021-.031 15.953-.067c3.251-.568 3.579-3.423 3.541-4.98c5.808.323 9.896-3.776 8.871-9.219zm-14.751 4.683c-1.661 1.932-5.348 5.297-5.348 5.297s-.161.161-.417.031c-.099-.073-.14-.12-.14-.12c-.595-.588-4.491-4.063-5.381-5.271c-.943-1.287-1.385-3.599-.119-4.948c1.265-1.344 4.005-1.448 5.817.541c0 0 2.083-2.375 4.625-1.281c2.536 1.095 2.443 4.016.963 5.751m8.23.636c-1.24.156-2.244.036-2.244.036V9.714h2.359s2.631.735 2.631 3.516c0 2.552-1.313 3.557-2.745 4.021z" /></svg>) }
export function MaterialSymbolsFolder(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}<path fill="currentColor" d="M4 20q-.825 0-1.412-.587T2 18V6q0-.825.588-1.412T4 4h6l2 2h8q.825 0 1.413.588T22 8v10q0 .825-.587 1.413T20 20z" /></svg>) }
export function LucideTag(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></g></svg>) }
export function LucideFolder(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}<path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>) }
export function OcticonRelFilePath16(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" {...props}>{/* Icon from Octicons by GitHub - https://github.com/primer/octicons/blob/main/LICENSE */}<path fill="currentColor" d="M13.94 3.045a.75.75 0 0 0-1.38-.59l-4.5 10.5a.75.75 0 1 0 1.38.59zM5 11.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0" /></svg>) }
export function RadixIconsCross2(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 15 15" {...props}>{/* Icon from Radix Icons by WorkOS - https://github.com/radix-ui/icons/blob/master/LICENSE */}<path fill="currentColor" d="M10.969 3.219a.574.574 0 1 1 .812.812L8.313 7.5l3.468 3.469l.074.09a.575.575 0 0 1-.796.796l-.09-.074L7.5 8.312l-3.469 3.47a.574.574 0 1 1-.812-.813L6.688 7.5l-3.47-3.469l-.073-.09a.575.575 0 0 1 .796-.797l.09.075L7.5 6.687z" /></svg>) }
export function MaterialSymbolsAlternateEmail(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}<path fill="currentColor" d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12v1.45q0 1.475-1.012 2.513T18.5 17q-.875 0-1.65-.375t-1.3-1.075q-.725.725-1.638 1.088T12 17q-2.075 0-3.537-1.463T7 12t1.463-3.537T12 7t3.538 1.463T17 12v1.45q0 .65.425 1.1T18.5 15t1.075-.45t.425-1.1V12q0-3.35-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20h5v2zm0-7q1.25 0 2.125-.875T15 12t-.875-2.125T12 9t-2.125.875T9 12t.875 2.125T12 15" /></svg>) }
export function MingcuteAttachmentLine(props: React.SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from MingCute Icon by MingCute Design - https://github.com/Richard9394/MingCute/blob/main/LICENSE */}<g fill="none" fillRule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M18.71 17.565a4.25 4.25 0 0 0 0-6.01l-6.54-6.54A1 1 0 0 1 13.584 3.6l6.54 6.54a6.25 6.25 0 1 1-8.838 8.84l-7.954-7.955A4.501 4.501 0 0 1 9.698 4.66l7.953 7.953a2.752 2.752 0 0 1-3.892 3.891L6.513 9.257a1 1 0 0 1 1.414-1.415l7.247 7.247a.751.751 0 0 0 1.063-1.062L8.284 6.074A2.501 2.501 0 0 0 4.746 9.61l7.954 7.954a4.25 4.25 0 0 0 6.01 0Z" /></g></svg>) }
export function MaterialSymbolsPublic(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}<path fill="currentColor" d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m-1-2.05V18q-.825 0-1.412-.587T9 16v-1l-4.8-4.8q-.075.45-.137.9T4 12q0 3.025 1.988 5.3T11 19.95m6.9-2.55q1.025-1.125 1.563-2.512T20 12q0-2.45-1.362-4.475T15 4.6V5q0 .825-.587 1.413T13 7h-2v2q0 .425-.288.713T10 10H8v2h6q.425 0 .713.288T15 13v3h1q.65 0 1.175.388T17.9 17.4" /></svg>) }
export function MaterialSymbolsLock(props: SVGProps<SVGSVGElement>) { return (<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>{/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}<path fill="currentColor" d="M6 22q-.825 0-1.412-.587T4 20V10q0-.825.588-1.412T6 8h1V6q0-2.075 1.463-3.537T12 1t3.538 1.463T17 6v2h1q.825 0 1.413.588T20 10v10q0 .825-.587 1.413T18 22zm6-5q.825 0 1.413-.587T14 15t-.587-1.412T12 13t-1.412.588T10 15t.588 1.413T12 17M9 8h6V6q0-1.25-.875-2.125T12 3t-2.125.875T9 6z" /></svg>) }


export const useField = <T, E>(initialData: T, opts:
  {
    validate: (value: NoInfer<T>, abortSignal: { aborted: boolean }) => MaybePromise<E>,
    warn?: (value: NoInfer<T>, abortSignal: { aborted: boolean }) => MaybePromise<string[]>,
    placeholder?: string,
    equalityCheck?: (a: NoInfer<T>, b: NoInfer<T>) => boolean,
    onSave?: (value: NoInfer<T>) => MaybePromise<void>,
    fieldValueState?: {
      value: NoInfer<T>,
      setValue: React.Dispatch<React.SetStateAction<T>>
    },
    hasNoErrorFn?: (error: E | undefined) => boolean
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
  const [ __value, __setValue ] = useState(initialData)
  const value = opts.fieldValueState ? opts.fieldValueState.value : __value
  const setValue = opts.fieldValueState ? opts.fieldValueState.setValue : __setValue

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

  const hasNoError = opts.hasNoErrorFn ? opts.hasNoErrorFn(error) : error === undefined
  const saveable = isChanged && hasNoError
  const resettable = isChanged
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue((e.target as any).value)
  }
  const reset = () => {
    setValue(initialData)
    setIsFocus(false)
  }

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

  const save = opts.onSave ? async () => {
    if (saveable) {
      await opts.onSave!(value)
      setIsFocus(false)
    } else {
      console.log("not saveable, skipping save")
    }
  } : () => { }

  const forceSave = async () => {
    await opts.onSave?.(value)
    setIsFocus(false)
  }

  return {
    value, setValue, isChanged,
    error, warns, isValidating, isCheckingWarns, resetValidate, resetWarns,
    saveable, onChange,
    resettable, reset, exists, clearable: opts.clearable, onClear,
    onSetToNonUndefined,
    isFocus, setIsFocus, isEditing,
    save, forceSave
  } as const
}






export function SubInput<T extends string | number | readonly string[] | undefined>(props: {
  Icon: (props: { className: string }) => React.ReactNode,
  value: T | undefined,
  placeholder: string,
  onSetNotUndefined: () => void,
  onSetUndefined: () => void,
  inputOnChange: (e: ChangeEvent<HTMLInputElement>) => void,
  setLabel: React.ReactNode,
  error: string | undefined,
  renderUndefined?: () => React.ReactNode,
  inputRef?: React.Ref<HTMLInputElement | null>,
  clearable?: boolean,
}) {
  const CloseButton = (props: ComponentProps<"button">) => <button {...props} className={cn("button ghost p-1 text-fg-4 hover:text-fg-3 shrink-0 h-8 block text-base leading-5 w-5.5 p-0", props.className)}><LucideX /></button>

  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="">
      <div className="flex gap-1 items-start">
        <props.Icon className="text-fg-4 shrink-0 min-w-4.5 h-8 ml-1" />
        {props.value === undefined ?
          (props.renderUndefined?.() ??
            <InputButton onClick={() => {
              props.onSetNotUndefined()
              setTimeout(() => {
                ref.current?.focus()
              }, 0)
            }} className="">
              <LucidePlus />{props.setLabel}
            </InputButton>)
          :
          <>
            <InputBase ref={(el) => {
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
            {props.clearable !== false &&
              <CloseButton onClick={props.onSetUndefined} />
            }
          </>
        }
      </div>
      <ErrorMessage error={props.error} className="ml-9 text-xs -mt-1" />
    </div>
  )
}


function SubInputFooter(props: ComponentProps<"div">) { return <div {...props} className={cn("flex items-center gap-2 px-2 py-1 text-xs", props.className)} /> }

export function CollectionInputItemGroup(props: ComponentProps<"div"> & {
  error?: string | object | undefined,
  single?: boolean
}) {
  function CollectionSeparator(props: ComponentProps<"div">) {
    return <div {...props} className={cn("border-t border-t-fg-4 mb-0 mx-0.5", props.className)} />
  }
  return <div {...props} className={cn("flex flex-col px-1 py-1", props.className)}>
    {props.children}
    {!props.single && <>
      <SubInputFooter className="mb-1">
        <ErrorMessage error={typeof props.error === "string" ? props.error : undefined} />
      </SubInputFooter>
      <CollectionSeparator />
    </>}
  </div>
}


export function BasicFieldFooter({
  classNames, error,
  warns, resettable,
  isChanged, saveable,
  onSave,
  onReset,
}: {
  classNames?: {
    inputBlockFooter?: string,
    inputBlockMessage?: string,
    inputButton?: string
  },
  error: any,
  warns: string[],
  resettable: boolean,
  isChanged: boolean,
  saveable: boolean,
  onSave: () => void,
  onReset?: () => void
}) {
  const isInputBlockFooterExpanded = resettable || isChanged || error !== undefined || (warns && warns.length > 0)

  return (
    <InputBlockFooter
      expanded={isInputBlockFooterExpanded}
      className={cn(classNames?.inputBlockFooter)}
    >
      <InputBlockMessage className={cn(classNames?.inputBlockMessage)}>
        <ErrorMessage error={error} />
        <WarnMessages warns={warns} />
      </InputBlockMessage>
      {resettable && <button
        disabled={!resettable}
        className={cn("button text-xs ghost", classNames?.inputButton)} onClick={onReset}>
        Revert
      </button>}
      {isChanged && <button
        disabled={!saveable}
        className={cn("button text-xs", classNames?.inputButton)}
        onClick={onSave}>
        Save
      </button>}
    </InputBlockFooter>
  )
}