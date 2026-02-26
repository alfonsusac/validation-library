export const packageJsonParser = {
  name: {
    validate: (value: unknown, isExist: (value: string) => boolean) => {
      if (typeof value !== "string")
        return "name must be a string"
      if (value.length === 0)
        return "name cannot be empty"
      if (/^[a-z0-9-@/_]+$/.test(value) === false)
        return "name can only contain lowercase letters, numbers, hyphens and underscores"
      if (value.length > 214)
        return "name cannot be longer than 214 characters"
      if (value.startsWith(".") || value.startsWith("_"))
        return "name cannot start with a dot or an underscore, unless scoped"
      if (value.startsWith("@") && value.includes("/") === false)
        return "scoped package name must include a slash"
      if (isExist(value))
        return "a package with this name already exists"
    },
    warn: (value: string) => {
      const enum warning {
        nodeName = "don't use the same name as a core Node module.",
        longName = "name is quite long, consider using a shorter name for better readability",
        redundantName = "it is implied that this is a JavaScript package, so including 'node' or 'js' in the name is redundant",
      }
      const warnings: warning[] = []
      if ([
        "assert", "assert/strict", "async_hooks", "buffer", "child_process", "cluster", "console", "constants", "crypto", "dgram", "diagnostics_channel", "dns", "dns/promises", "domain", "events", "fs", "fs/promises", "http", "http2", "https", "inspector", "module", "net", "os", "path", "path/posix", "path/win32", "perf_hooks", "process", "punycode", "querystring", "readline", "readline/promises", "repl", "stream", "stream/consumers", "stream/promises", "stream/web", "string_decoder", "sys", "timers", "timers/promises", "tls", "trace_events", "tty", "url", "util", "util/types", "v8", "vm", "wasi", "worker_threads", "zlib"
      ].includes(value))
        warnings.push(warning.nodeName)
      if (value.length > 35)
        warnings.push(warning.longName)
      if (value.includes("node") || value.includes("js"))
        warnings.push(warning.redundantName)
      return warnings
    }
  },
  version: {
    validate: (value: unknown) => {
      if (typeof value !== "string")
        return "version must be a string"
      if (/^\d+\.\d+\.\d+(-.+)?$/.test(value) === false)
        return "version must be in the format of x.y.z or x.y.z-qualifier, where x, y, z are non-negative integers and qualifier is a string"
    }
  },
  description: {
    validate: (value: unknown) => {
      if (typeof value !== "string")
        return "description must be a string"
    }
  },
  keywords: {
    validate: (value: unknown) => {
      if (!Array.isArray(value))
        return "keywords must be an array"
      for (const keyword of value) {
        if (typeof keyword !== "string")
          return "keywords must be an array of strings"
      }
    }
  }
}