export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === "string") return e
  if (typeof e === "object" && e !== null)
    if ("message" in e && typeof e.message === "string") return e.message
    else return JSON.stringify(e)
  return String(e) // fallback for numbers, null, undefined, booleans
}