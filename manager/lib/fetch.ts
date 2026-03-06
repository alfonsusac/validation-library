import { getErrorMessage } from "./util-get-error-message"

const fetchCache = new Map<string, { timestamp: number, data: any }>()


export async function jfetch<T>(url: string, opts?: RequestInit) {

  async function makeFetch(url: string, opts?: RequestInit) {
    try {
      const res = await fetch(url, opts)
      console.log(`fetch) Fetch ${ url }: ${ res.status } ${ res.type } ${ res.headers.get("X-Cache") } ${ res.headers.get("Age")}`)
      const jsonRes = await (async () => {
        try {
          const json = await res.json() as T
          return { status: "ok" as const, jsondata: json }
        } catch (error) {
          return { status: "parse error" as const, message: "Invalid JSON response" }
        }
      })()
  
      return { status: "ok" as const, json: jsonRes }
    } catch (error) {
      return { status: "fetch error" as const, message: getErrorMessage(error) }
    }
  }

  const cacheKey = `${ url }|${ JSON.stringify(opts) }`
  const cached = fetchCache.get(cacheKey)
  const now = Date.now()
  if (cached && (now - cached.timestamp < 10000)) {
    console.log(`fetch) HIT     -  ${ url }`)
    return cached.data
  } else {
    if (cached) {
      console.log(`fetch) EXPIRED - ${ url }`)
    } else {
      console.log(`fetch) MISS    - ${ url }`)
    }
    const result = await makeFetch(url, opts)
    fetchCache.set(cacheKey, { timestamp: now, data: result })
    return result
  }

}