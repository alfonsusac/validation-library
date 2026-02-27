import { getErrorMessage } from "./util-get-error-message"

export async function jfetch(url: string, opts?: {}) {
  try {
    const res = await fetch(url, opts)

    console.log(`Fetch ${ url }: ${ res.status } ${ res.type } ${ res.headers.get("X-Cache") } ${ res.headers.get("Age")}`)

    const jsonRes = await (async () => {
      try {
        return { status: "ok" as const, data: await res.json() }
      } catch (error) {
        return { status: "parse error" as const, data: "Invalid JSON response" }
      }
    })()

    return { status: "ok" as const, json: jsonRes, response: res }
  } catch (error) {
    return { status: "fetch error" as const, message: getErrorMessage(error) }
  }
}