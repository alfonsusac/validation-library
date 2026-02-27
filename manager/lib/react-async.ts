import type { MaybePromise } from "bun"
import { useEffect, useState } from "react"
import { getErrorMessage } from "./util-get-error-message"

type UseAsyncReturn<D> = {
  status: "ok",
  result: D,
} | {
  status: "error",
  error: string,
} | {
  status: "loading"
} | {
  status: "idle"
}

export function useAsync<D>(
  fn: (signal: { aborted: boolean }) => MaybePromise<D>,
  deps: any[] = []
) {
  const [ state, setState ] = useState<UseAsyncReturn<D>>({ status: "idle" })

  useEffect(() => {
    let signal = {aborted: false}
    setState({ status: "loading" });
    //
    (async () => {
      try {
        const result = await fn(signal)
        if (!signal.aborted) setState({ status: "ok", result })
      } catch (error) {
        if (!signal.aborted) setState({ status: "error", error: getErrorMessage(error) })
      }
    })()
    return () => {
      signal.aborted = true
    }
  }, deps)

  const isLoading = state.status === "loading"
  const reset = () => setState({ status: "idle" })

  return [ state, isLoading, reset ] as [
    state: UseAsyncReturn<D>,
    isLoading: boolean,
    reset: () => void
  ]
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