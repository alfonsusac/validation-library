import { getErrorMessage } from "./util-get-error-message"

export async function jfetch<T>(url: string, opts?: RequestInit) {
  try {
    const res = await fetch(url, opts)

    console.log(`Fetch ${ url }: ${ res.status } ${ res.type } ${ res.headers.get("X-Cache") } ${ res.headers.get("Age")}`)

    const jsonRes = await (async () => {
      try {
        const json = await res.json() as T
        // console.log("Json: ", json)
        return { status: "ok" as const, jsondata: json }
      } catch (error) {
        return { status: "parse error" as const, message: "Invalid JSON response" }
      }
    })()

    return { status: "ok" as const, json: jsonRes, response: res }
  } catch (error) {
    return { status: "fetch error" as const, message: getErrorMessage(error) }
  }
}