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
      if (typeof value === "undefined")
        return
      if (typeof value !== "string")
        return "description must be a string"
    }
  },
  keywords: {
    validate: (value: unknown) => {
      if (typeof value === "undefined")
        return
      if (!Array.isArray(value))
        return "keywords must be an array"
      for (const keyword of value) {
        if (typeof keyword !== "string")
          return "keywords must be an array of strings"
      }
    }
  },
  homepage: {
    validate: (value: unknown) => {
      if (typeof value === "undefined")
        return
      if (typeof value !== "string")
        return "homepage must be a string"
      try {
        new URL(value)
      } catch {
        return "homepage must be a valid URL"
      }
    }
  },
  bugs: {
    validate: (value: unknown) => {
      if (typeof value === "undefined") return
      if (typeof value !== "object" && typeof value !== "string")
        return "bugs must be an object or a string"
      if (value === null)
        return "bugs cannot be null"
      if (typeof value === "object") {
        if (!("url" in value) && !("email" in value))
          return "bugs must have at least one of url or email"
        if ("url" in value && value.url !== undefined && typeof value.url !== "string")
          return "bugs.url must be a string"
        if ("url" in value && value.url !== undefined && typeof value.url === "string") {
          try {
            new URL(value.url)
          } catch {
            return "bugs.url must be a valid URL"
          }
        }
        if ("email" in value && value.email !== undefined && typeof value.email !== "string")
          return "bugs.email must be a string"
        // either one or both of url and email should be present
      }
    }
  },
  license: {
    // - [ ] no license means "All rights reserved"
    // - [ ] error: must uses SPDX license identifier (fetch list)
    // - [ ] warn: consider using one that are OSI approvied
    // - [ ] error: multiple must follow SPDX format (e.g. MIT OR Apache-2.0)
    // - [ ] support for custom license file (e.g. "SEE LICENSE IN LICENSE.txt")
    // - [ ] only allow max 2 licenses because SPDX format for multiple licenses is hard to parse and validate, and it's uncommon to have more than 2 licenses. If more than 2 licenses are needed, users can use a custom license file.
    // - [ ] allow unlicensed
    validate: (value: unknown, spdxLicenseId: string[]) => {
      if (typeof value === "undefined")
        return
      if (typeof value !== "string")
        return "license must be a string"
      // Todo : validate with SPDX expression
      if (value === "UNLICENSED")
        return
      if (value.startsWith("SEE LICENSE IN ")) {
        const licenseFile = value.slice("SEE LICENSE IN ".length)
        // TODO: validate as file path
        if (licenseFile.length === 0)
          return "license file name cannot be empty"
        if (/\s/.test(licenseFile))
          return "license file name cannot contain whitespace"
        return
      }
    }
  }
}