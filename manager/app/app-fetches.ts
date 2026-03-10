import { jsonfetch } from "../lib/fetch"


export async function checkNPMName(name: string) {
  const url = `https://registry.npmjs.org/${ name }`
  const res = await jsonfetch<{
    _id: string
  }>(url)

  if (res.status === "fetch error")
    return "fetch error"

  if (res.status === "parse error")
    return "malformed error"

  if (res.res.status === 404)
    return "available" // OK

  if (!res.res.ok)
    return "unexpected server response"

  const json = res.json
  try {
    return json._id
  } catch (error) {
    console.error("Error parsing JSON response:", error)
    return "unexpected response data"
  }
}