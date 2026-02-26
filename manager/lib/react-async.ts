import { useEffect, useEffectEvent, useRef, useState } from "react"

export function useAsync(
  fn: (signal: { aborted: boolean }) => Promise<any> | any,
  deps: any[] = []
) {

  const [ state, setState ] = useState<{
    status: "ok",
    result: any,
  } | {
    status: "error",
    error: any,
  } | {
    status: "loading"
  } | {
    status: "idle"
  }>({ status: "idle" })

  // Not sure if this works
  // const _fn = useEffectEvent(fn)

  useEffect(() => {
    let signal = {aborted: false}
    setState({ status: "loading" });
    //
    (async () => {
      try {
        const result = await fn(signal)
        if (!signal.aborted) setState({ status: "ok", result })
      } catch (error) {
        if (!signal.aborted) setState({ status: "error", error })
      }
    })()
    return () => {
      signal.aborted = true
    }
  }, deps)

  const isLoading = state.status === "loading"
  const reset = () => setState({ status: "idle" })

  return [ state, isLoading, reset ] as const
}


// Example Usage
() => {
  const [ val, setVal ] = useState("")
  const [ delayedVal, loading, reset ] = useAsync(async (signal) => {
    console.log("Sending ", val)

    await new Promise(resolve => setTimeout(resolve,
      Math.random() * 2500
    ))

    // we can implement debouncer here by checking if the signal is 
    //  aborted before doing any work like making API calls or heavy computations, 
    //  and if it is aborted, we can just return early without doing anything.
    // This way, if the user types something new before the previous async operation 
    //  is completed, the previous operation will be aborted and won't update 
    //  the state with outdated information.
    if (signal.aborted) {
      console.log("aborted ", val)
      throw new Error("aborted")
    }

    return val
  }, [ val ])
}