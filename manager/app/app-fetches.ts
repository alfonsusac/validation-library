import type { $JSONFetchRoutesType } from "../.."
import { jfetch } from "../lib/fetch"
import { createJsonFetcher } from "../lib/fetch-schema"


export const fetchServer = createJsonFetcher<typeof $JSONFetchRoutesType>()



export async function checkNPMName(name: string) {
  const url = `https://registry.npmjs.org/${ name }`
  const res = await jfetch(url)

  if (res.status === "fetch error") {
    return "fetch error"
  }

  if (res.response.status === 404) {
    return "available" // OK
  }

  if (!res.response.ok) {
    return "unexpected server response"
  }

  if (res.json.status === "parse error") {
    return "malformed json"
  }

  const json = res.json.jsondata
  if (typeof json === "object" && json !== null
    && "_id" in json && typeof json._id === "string"
  ) {
    return "exists"
  }
  return "unexpected response data"
}