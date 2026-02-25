export const packageJson = {
  name: {
    validate: async (value: unknown, isExist: (value: string) => Promise<boolean>) => {
      if (typeof value !== "string")
        return "name must be a string"
      if (value.length === 0)
        return "name cannot be empty"
      if (/^[a-z0-9-_]+$/.test(value) === false)
        return "name can only contain lowercase letters, numbers, hyphens and underscores"
      if (value.length > 214)
        return "name cannot be longer than 214 characters"
      if (value.startsWith(".") || value.startsWith("_"))
        return "name cannot start with a dot or an underscore, unless scoped"
      if (value.startsWith("@") && value.includes("/") === false)
        return "scoped package name must include a slash"
      if (await isExist(value))
        return "a package with this name already exists"
    },
    warn: (value: string) => {
      if ([
        "assert", "assert/strict", "async_hooks", "buffer", "child_process", "cluster", "console", "constants", "crypto", "dgram", "diagnostics_channel", "dns", "dns/promises", "domain", "events", "fs", "fs/promises", "http", "http2", "https", "inspector", "module", "net", "os", "path", "path/posix", "path/win32", "perf_hooks", "process", "punycode", "querystring", "readline", "readline/promises", "repl", "stream", "stream/consumers", "stream/promises", "stream/web", "string_decoder", "sys", "timers", "timers/promises", "tls", "trace_events", "tty", "url", "util", "util/types", "v8", "vm", "wasi", "worker_threads", "zlib"
      ].includes(value))
        return "don't use the same name as a core Node module."
      if (value.length > 50)
        return "name is quite long, consider using a shorter name for better readability"
      if (value.includes("node") || value.includes("js"))
        return "it is implied that this is a JavaScript package, so including 'node' or 'js' in the name is redundant"
    }
  }
}