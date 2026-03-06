// Valid path:
// - /
// - /package-json
// - /* 
// - /package-json/*
// - /+
// - /package-json/+

export function matchRoute(current: string, path: string) {
  if (path.endsWith("/*")) {
    const basePath = path.slice(0, -2)
    return current === basePath || current.startsWith(basePath + "/")
  }
  if (path.endsWith("/+")) {
    const basePath = path.slice(0, -1)
    if (current === basePath) return false
    return current.startsWith(basePath + "/")
  }
  return current === path
}