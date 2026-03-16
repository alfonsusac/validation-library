// Valid path:
// - /
// - /package-json
// - /* 
// - /package-json/*
// - /+
// - /package-json/+

export function matchRoute(current: string, path: string) {
  const [ currpath, currsp ] = current.split("?") 
  
  if (path.endsWith("/*")) {
    const basePath = path.slice(0, -2)
    return currpath === basePath || currpath.startsWith(basePath + "/")
  }
  if (path.endsWith("/+")) {
    const basePath = path.slice(0, -1)
    if (currpath === basePath) return false
    return currpath.startsWith(basePath + "/")
  }
  return currpath === path
}