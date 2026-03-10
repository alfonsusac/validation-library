import { getErrorCode, getErrorMessage } from "./util-get-error-message"

export async function jsonfetch<T>(url: string, opts?: RequestInit) {
  try {
    const res = await fetch(url, opts)
    const readonlyRes = {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      redirected: res.redirected,
      statusText: res.statusText,
      url: res.url,
      type: res.type
    }
    try {
      const json = await res.json() as T
      const result = {
        status: "ok" as const, json,
        res: readonlyRes,
      } satisfies SuccessDataResult<T>
      return result
    } catch (error) {
      return {
        status: "parse error" as const,
        readonlyRes,
        error,
        errorCode: getErrorCode(error),
        errorMessage: getErrorMessage(error),
      }
    }
  } catch (error) {
    return {
      status: "fetch error" as const, error,
      errorCode: getErrorCode(error),
      errorMessage: getErrorMessage(error)
    }
  }
}

type SuccessDataResult<T> = {
  status: "ok", json: T,
  res: {
    ok: boolean,
    status: number,
    headers: Headers,
    redirected: boolean,
    statusText: string,
    url: string,
    type: string
  }
}








// const fetchCache = new Map<string, { timestamp: number, data: any, invalidated: boolean }>()

// export async function jfetch<T>(url: string, opts?: RequestInit) {

//   async function makeFetch(url: string, opts?: RequestInit) {
//     try {
//       const res = await fetch(url, opts)
//       console.log(`fetch) Fetch ${ url }: ${ res.status } ${ res.type } ${ res.headers.get("X-Cache") } ${ res.headers.get("Age") }`)
//       const jsonRes = await (async () => {
//         try {
//           const json = await res.json() as T
//           return { status: "ok" as const, jsondata: json }
//         } catch (error) {
//           return { status: "parse error" as const, message: "Invalid JSON response" }
//         }
//       })()

//       return { status: "ok" as const, json: jsonRes }
//     } catch (error) {
//       return { status: "fetch error" as const, message: getErrorMessage(error) }
//     }
//   }

//   const cacheKey = `${ url }|${ JSON.stringify(opts) }`
//   const cached = fetchCache.get(cacheKey)
//   const now = Date.now()
//   if (!cached) {
//     console.log(`fetch) MISS`)
//     const res = await makeFetch(url, opts)
//     fetchCache.set(cacheKey, { timestamp: now, data: res, invalidated: false })
//     return res
//   }
//   if (now - cached.timestamp < 10000) {
//     console.log(`fetch) HIT ${ url }`)
//     return cached.data
//   } else {
//     console.log(`fetch) STALE ${ url }`)
//     const cachedData = cached.data;
//     (async () => {
//       const res = await makeFetch(url, opts)
//       fetchCache.set(cacheKey, { timestamp: now, data: res, invalidated: false })
//     })()
//     return cachedData
//   }
// }


// function log(...args: any[]) {
//   console.log(`${ color("darkgreen", "ansi") }fetch`, ...args)
// }


