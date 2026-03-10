import type { PackageJson } from "./package-json"

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
        if ("url" in value && value.url !== undefined) {
          if (typeof value.url !== "string")
            return "bugs.url must be a string"
          if (!validUrl(value.url))
            return "bugs.url must be a valid URL"
        }
        if ("email" in value && value.email !== undefined) {
          if (typeof value.email !== "string")
            return "bugs.email must be a string"
          if (!validEmail(value.email))
            return "bugs.email must be a valid email address"
        }
      }
    },
    isEqual: (a: PackageJson[ 'bugs' ], b: PackageJson[ 'bugs' ]) => {
      if (typeof a === "string" && typeof b === "string")
        return a === b
      if (typeof a === "object" && a !== null && typeof b === "object" && b !== null)
        return a.url === b.url && a.email === b.email
      if (typeof a === "string" && typeof b === "object" && 'url' in b && typeof b.url === "string")
        return a === b.url
      if (typeof b === "string" && typeof a === "object" && 'url' in a && typeof a.url === "string")
        return a.url === b
      else
        return a === b
    }
  },
  license: {
    // - [v] no license means "All rights reserved"
    // - [v] error: must uses SPDX license identifier (fetch list)
    // - [ ] info: consider using one that are OSI approvied
    // - [ ] error: multiple must follow SPDX format (e.g. MIT OR Apache-2.0)
    // - [ ] support for custom license file (e.g. "SEE LICENSE IN LICENSE.txt")
    // - [ ] only allow max 2 licenses because SPDX format for multiple licenses is hard to parse and validate, and it's uncommon to have more than 2 licenses. If more than 2 licenses are needed, users can use a custom license file.
    // - [v] allow unlicensed
    validate: (value: unknown, validLicenses?: { id: string }[]) => {
      if (typeof value === "undefined") return
      if (typeof value !== "string") return "license must be a string"
      if (value === "UNLICENSED")
        return
      if (value.startsWith("SEE LICENSE IN ")) {
        const licenseFile = value.slice("SEE LICENSE IN ".length)
        if (licenseFile.length === 0)
          return "license file name cannot be empty"
        if (/\s/.test(licenseFile))
          return "license file name cannot contain whitespace"
        return
      }
      if (!validLicenses) return
      if (validLicenses && validLicenses.map(l => l.id).includes(value) === false)
        return "license must be a valid SPDX license identifier"
    }
  },
  commons: {
    requireURL: {
      validate: (value: unknown) => {
        if (typeof value === "undefined") return "URL is required"
        if (typeof value !== "string") return "URL must be a string"
        if (!validUrl(value)) return "URL must be a valid URL"
      }
    },
    optionalURL: {
      validate: (value: unknown) => {
        if (typeof value === "undefined") return
        return packageJsonParser.commons.requireURL.validate(value)
      }
    },
    optionalEmail: {
      validate: (value: unknown) => {
        if (typeof value === "undefined") return
        if (typeof value !== "string") return "email must be a string"
        if (!validEmail(value)) return "email must be a valid email address"
      }
    }
  },
  author: {
    validate: (value: unknown) => {
      return validatePerson(value, "author")
    },
    normalize(val: PackageJson[ 'author' ]) {
      if (typeof val === "undefined") return val
      if (typeof val === "object" && val !== null) return val
      // parse string in the format of "name <email> (url)"
      const regex = /^([^<(]+)(?:<([^>]+)>)?(?:\(([^)]+)\))?$/
      const match = val.match(regex)
      if (!match)
        return { name: val.trim() }
      const name = match[ 1 ].trim()
      const email = match[ 2 ]?.trim()
      const url = match[ 3 ]?.trim()
      const result: { name: string, email?: string, url?: string } = { name }
      if (email) result.email = email
      if (url) result.url = url
      return result
    },
    isEqual: (A: PackageJson[ 'author' ], B: PackageJson[ 'author' ]) => {
      const a = packageJsonParser.author.normalize(A)
      const b = packageJsonParser.author.normalize(B)
      return JSON.stringify(a) === JSON.stringify(b)
    }
  },
  contributors: {
    normalize(val: PackageJson[ 'contributors' ]) {
      // traverse array,
      // if string encountered, change to object with name only, and trim whitespace
      const normalizePerson = packageJsonParser.author.normalize
      if (val === undefined) return val
      for (let i = 0; i < val.length; i++) {
        const contributor = val[ i ]
        if (typeof contributor === "string") {
          val[ i ] = normalizePerson(contributor)
        } else if (typeof contributor === "object" && contributor !== null && "name" in contributor) {
          contributor.name = contributor.name.trim()
        }
      }
      return val as { name: string, email?: string, url?: string }[]
    },
    validate(val: unknown) {
      if (typeof val === "undefined")
        return
      if (!Array.isArray(val))
        return "contributors must be an array"
      const errors: ({
        name: string | undefined,
        email: string | undefined,
        url: string | undefined
      } | string | undefined)[] = val.map((value, index) => {
        return validatePerson(value, `contributor[${ index }]`)
      })
      if (errors.every(e => typeof e === "undefined"))
        return
      return errors

      

      // for (let i = 0; i < val.length; i++) {
      //   const res = validatePerson(val[ i ], `contributor[${ i }]`)
      //   if (typeof res === "string")
      //     return `${ ordinalize(i + 1) } contributor is invalid`
      // }
    },
    // validateEach(val: unknown) {
    //   return validatePerson(val, "contributor")
    // },
    isEqual(A: PackageJson[ 'contributors' ], B: PackageJson[ 'contributors' ]) {

    }
  }
}



function ordinalize(n: number) {
  const s = [ "th", "st", "nd", "rd" ]
  const v = n % 100
  return n + (s[ (v - 20) % 10 ] || s[ v ] || s[ 0 ])
}

function validEmail(email: string) {
  // Simple email regex for validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function validatePerson(value: unknown, varname: string) {
  if (typeof value === "undefined")
    return
  if (typeof value === "string")
    return
  if (typeof value !== "object" || value === null)
    return `${ varname } must be a string or an object`
  const error = {
    name: (() => {
      if (!("name" in value))
        return `name is required` as const
      if (typeof value.name !== "string" || value.name.length === 0)
        return `name must be a string` as const
    })(),
    email: (() => {
      if ("email" in value && value.email !== undefined) {
        if (typeof value.email !== "string")
          return `email must be a string` as const
        if (!validEmail(value.email))
          return `email must be a valid email address` as const
      }
    })(),
    url: (() => {
      if ("url" in value && value.url !== undefined) {
        if (typeof value.url !== "string")
          return `url must be a string` as const
        if (!validUrl(value.url))
          return `url must be a valid URL` as const
      }
    })()
  }
  if (Object.values(error).some(v => typeof v === "string"))
    return error
  return
}