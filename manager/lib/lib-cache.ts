import type { MaybePromise } from "bun"

export function createCache(deps: {
  store: {
    get<T>(key: string): MaybePromise<T | undefined>
    set<T>(key: string, value: T): MaybePromise<any>
    delete(key: string): MaybePromise<any>
  },
}) {
  function cacheFn<I extends any[], O>(
    fn: (...args: I) => O,
    additionalCacheKey?: string | undefined
  ) {
    return async (...args: I): Promise<O> => {
      const cacheKey = `${ fn.toString() }${ additionalCacheKey ?? "" }${ JSON.stringify(args) }`
      const cached = await deps.store.get<O>(cacheKey)
      if (cached !== undefined) {
        return cached
      }
      const result = await fn(...args)
      await deps.store.set(cacheKey, result)
      return result
    }
  }

  return cacheFn
}