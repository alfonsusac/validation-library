import type { MaybePromise } from "bun"
import { getErrorCode } from "./util-get-error-message"
import { WatchJsonFile } from "./file-controller"

interface Cacher<T> {
  get(key: string): MaybePromise<T | undefined>,
  set(key: string, value: T): MaybePromise<any>,
  delete(key: string): MaybePromise<any>
}
function Cacher<T>(opts: Cacher<T>) {
  return opts
}


export async function DataCache(path: `./${ string }`) {

  const cacheFile = WatchJsonFile<Record<string, {
    
  }>>(path, {
    onNotExist: file => {
      file.write(JSON.stringify({}))
      return {}
    }
  })

  return Cacher({
    get: async (key: string) => {
      const data = cacheFile.get()!

    },
    set: async (key: string, value: void) => {

    },
    delete: (key: string) => {

    }
  })
}




// export function Cacher(deps: {
//   store: {
//     get<T>(key: string): MaybePromise<T | undefined>
//     set<T>(key: string, value: T): MaybePromise<any>
//     delete(key: string): MaybePromise<any>
//   },
// }) {
//   function cacheFn<I extends any[], O>(
//     fn: (...args: I) => O,
//     additionalCacheKey?: string | undefined
//   ) {
//     return async (...args: I): Promise<O> => {
//       const cacheKey = `${ fn.toString() }${ additionalCacheKey ?? "" }${ JSON.stringify(args) }`
//       const cached = await deps.store.get<O>(cacheKey)
//       if (cached !== undefined) {
//         return cached
//       }
//       const result = await fn(...args)
//       await deps.store.set(cacheKey, result)
//       return result
//     }
//   }
//   return cacheFn
// }



