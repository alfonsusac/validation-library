export async function jsonfetch(url: string, opts?: {}) {
  try {
    const res = await fetch(url, opts)
    if (!res.ok) {
      return { status: "error" as const, message: `!res.ok: (${ res.status })`, statusCode: res.status }
    }
    return { status: "ok" as const, data: await res.json() }
  } catch (error) {
    return { status: "fetch error" as const, message: error }
  }
}