export type Duration = `${ number }s` | `${ number }m` | `${ number }h` | `${ number }d` | "forever"

export function durationToMs(duration: Duration): number {
  if (duration === "forever") return Infinity
  const match = duration.match(/^(\d+)([smhd])$/)
  if (!match) throw new Error(`Invalid duration format: ${ duration }`)
  const value = parseInt(match[ 1 ], 10)
  const unit = match[ 2 ]
  switch (unit) {
    case "s": return value * 1000
    case "m": return value * 60 * 1000
    case "h": return value * 60 * 60 * 1000
    case "d": return value * 24 * 60 * 60 * 1000
    default: throw new Error(`Invalid duration unit: ${ unit }`)
  }
}