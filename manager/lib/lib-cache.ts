import type { MaybePromise } from "bun"
import { JSONFileController } from "./file-controller"
import { durationToMs, type Duration } from "./util-duration"
import { getErrorMessage } from "./util-get-error-message"

export type DataCacheType = ReturnType<typeof DataCache>

export function DataCache(path: `./${ string }`, opts: { expiry: Duration }) {

  const file = JSONFileController<Record<string, { timestamp: number, data: any }>>(path, { onNotExist: "create", watch: false })

  async function initialize() {
    await file.initialize()
  }

  async function get<T>(key: string) {
    const cache = file.get()
    if (key in cache)
      return { data: cache[ key ].data as T, state: Date.now() - cache[ key ].timestamp < durationToMs(opts.expiry) ? "FRESH" as const : "EXPIRED" as const }
    return { data: null, state: "MISS" as const }
  }
  async function set<T>(key: string, data: T) {
    const cache = file.get()
    cache[ key ] = { timestamp: Date.now(), data }
    await file.set(cache)
  }

  async function cache<T>(key: string, fn: () => MaybePromise<T>) {
    const cached = await get<T>(key)
    if (cached.state === "FRESH")
      return cached.data
    try {
      const data = await fn()
      await set(key, data)
      return data
    } catch (error) {
      console.log(`Error in cache function for key ${ key }:`, getErrorMessage(error))
      if (cached.state === "EXPIRED") {
        console.log(`Returning expired cache for key ${ key } due to error.`)
        return cached.data
      }
      throw error
    }
  }

  return { get, set, initialize, cache }

}





















// type CacheableResponse = {
//   status: number,
//   statusText: string,
//   ok: boolean,
//   type: ResponseType,
//   redirected: boolean,
//   contentType?: string | null,
// }

// export function FetchCache(path: `./${ string }`, opts: {
//   expiry: Duration,
// }) {

//   const file = JSONFileController<
//     Record<string, {
//       timestamp: number,
//       res: CacheableResponse
//     }>>(path, { onNotExist: "create", watch: false })

//   async function get(key: string) {
//     const cache = file.get()
//     if (key in cache) return cache[ key ].res
//     return null
//   }
//   async function set(key: string, res: CacheableResponse) {
//     const cache = file.get()
//     cache[ key ] = { timestamp: Date.now(), res }
//     await file.set(cache)
//   }

//   async function fetchAndStore(url: string, opts?: RequestInit) {
//     const res = await afetch(url, opts)
//     if (res.status === "fetch error") {
//       console.log(`fetch error for ${ url }:`, res.errorMessage)
//       return res
//     }
//     if (res.json.status === "parse error") {
//       console.log(`parse error for ${ url }:`, res.json.message)
//       return res
//     }
//     await set(url, {
//       status: res.res.statusCode,
//       statusText: res.res.statusText,
//       ok: res.res.ok,
//       type: res.res.type,
//       redirected: res.res.redirected,
//       contentType: res.res.headers.get("Content-Type"),
//     })
//   }


//   async function fetcher(url: string, fetchopts?: RequestInit) {
//     if (fetchopts?.method && fetchopts.method.toUpperCase() !== "GET")
//       return afetch(url, fetchopts)

//     const cacheKey = `${ url }`
//     const cached = await get(cacheKey)
//     if (!cached) {

//     }
//     if (cached) {
//       const state = Date.now() - cached.timestamp < durationToMs(opts.expiry) ? "FRESH" : "EXPIRED"
//       if (state === "FRESH")
//         return
//     }
//   }

// }