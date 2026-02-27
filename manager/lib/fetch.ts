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



// A custom rpc client that uses jsonfetch to call server routes. 
//  The server routes are defined in a JSONFetchRoutes object, 
//  which maps route names to handler functions.The client will 
//  call the appropriate handler function based on the route 
//  name and arguments passed in.
type JSONFetchRoutes<
  G extends { [ key: string ]: string } = any,
  P extends any[] = any[],
> = {
  [ key: `GET:${ string }` ]: (query: G) => any,
  [ key: `POST:${ string }` ]: (...argsAsBody: P) => any
}


type JSONFetchServerReturnTypes = {
  status: "ok",
  data: any
} | {
  status: "error",
  errorMsg: string
} | {
  status: "invalid_request",
  errorMsg: string
}

const _Response = {
  ok: (result: any) => new Response(
    JSON.stringify({ status: "ok", data: result } satisfies JSONFetchServerReturnTypes),
    { headers: { "Content-Type": "application/json" } }
  ),
  error: (error: any) => new Response(
    JSON.stringify({ status: "error", errorMsg: error instanceof Error ? error.message : String(error) } satisfies JSONFetchServerReturnTypes),
    { headers: { "Content-Type": "application/json" }, status: 500 }
  ),
  invalidRequest: (errorMsg: string) => new Response(
    JSON.stringify({ status: "invalid_request", errorMsg } satisfies JSONFetchServerReturnTypes),
    { headers: { "Content-Type": "application/json" }, status: 400 }
  )
}

// type GetFetchType<R extends JSONFetchRoutes> = 

export function createJsonFetchClient<
  R extends JSONFetchRoutes
>(
  routeHandlers: R
) {
  function getBunRouteHandlers() {
    const bunRouteHandlers: { [ K in string ]: (req: Request) => Promise<Response> } = {} as any
    for (const routeName in routeHandlers) {
      const method = routeName.split(":")[ 0 ] as "GET" | "POST"
      const routePath = routeName.split(":")[ 1 ]

      bunRouteHandlers[ routePath ] = async (req: Request) => {
        try {
          // Getting the arguments from the request based on the method type
          const args = await (async () => {
            if (method === "GET") {
              const url = new URL(req.url)
              const query: { [ key: string ]: string } = {}
              // Construct query object
              url.searchParams.forEach((value, key) => {
                query[ key ] ??= value // only take the first value for each key, ignore duplicates
              })
              return [ query ]
            } else if (method === "POST") {
              const json = await req.json()
              if (!Array.isArray(json))
                return "POST body must be an array of arguments"
              return json
            } else {
              return "unsupported HTTP method"
            }
          })()
          if (typeof args === "string")
            return _Response.invalidRequest(args)

          const result = await routeHandlers[ routeName as `${ "GET" | "POST" }:${ string }` ](...(args as [ any ]))
          return _Response.ok(result)
        } catch (error) {
          console.log(`[jsonfetch] Error handling route ${ routeName }:`, error)
          return _Response.error(error)
        }
      }
    }
    return bunRouteHandlers
  }

  return {
    routeHandlers: getBunRouteHandlers(),
    $JSONFetchRoutesType: {} as R
  }
}




// for client:


// type GetRouteHandlers<R extends JSONFetchRoutes> = {
//   [ K in keyof R ]:
//   K extends `GET:${ string }` ? (query: R extends JSONFetchRoutes<infer G> ? G : never) => MaybePromise<ReturnType<R[ K ]>>
//   : K extends `POST:${ string }` ? (...argsAsBody: any[]) => MaybePromise<ReturnType<R[ K ]>> :
//   never
// }

type GetGETRouteHandlers<R extends JSONFetchRoutes> = {
  [ K in keyof R ]:
  K extends `GET:/${ string }` ?
  (query: Parameters<R[ K ]>[ 0 ]) => Promise<ReturnType<R[ K ]>>
  : never
}



type GetRouteNames<R extends JSONFetchRoutes> = keyof R & string


// type GetRouteNameFromType<R extends JSONFetchRoutes, M extends "GET" | "POST"> = {
//   [ K in keyof R ]: K extends `${ M }:${ infer RouteName }` ? RouteName : never
// }[ keyof R ]

type GetRouteArgsFromName<R extends JSONFetchRoutes, RouteName extends keyof R> = {
  [ K in keyof R ]: R[ K ] extends (...a: any[]) => any ? Parameters<R[ K ]> : never
}[ RouteName ]

type GetRouteReturnTypeFromName<R extends JSONFetchRoutes, RouteName extends keyof R> = {
  [ K in keyof R ]: R[ K ] extends (...a: any[]) => any ? Awaited<ReturnType<R[ K ]>> : never
}[ RouteName ]

// type GetRouteReturnTypeFromName<R extends JSONFetchRoutes, RouteName extends string> = {
//   [ K in keyof R ]: RouteName extends `${ "GET" | "POST" }:${ string }` ?
//   K extends RouteName ?
//   ReturnType<R[ K ]> : never : never
// }[ keyof R ]


export function createJsonFetcher<S extends JSONFetchRoutes>(
  baseUrl?: string
) {
  type RespondReturnType<T = any> = {
    status: "ok",
    data: T
  } | {
    status: "error",
    message: string
  } | {
    status: "fetch error",
    message: any
  }
  return async function myfetch<
    R extends GetRouteNames<S>
  >(
    route: R,
    ...args: GetRouteArgsFromName<S, R>
  ) {
    const _respond = {
      ok: (result: any): RespondReturnType<Awaited<GetRouteReturnTypeFromName<S, R>>> => ({ status: "ok", data: result }),
      error: (message: string): RespondReturnType<Awaited<GetRouteReturnTypeFromName<S, R>>> => ({ status: "error", message }),
      fetchError: (message: any): RespondReturnType<Awaited<GetRouteReturnTypeFromName<S, R & string>>> => ({ status: "fetch error", message })
    }
    const [ method, path ] = route.split(":") as [ method: "GET" | "POST", path: string ]

    try {
      // validate json if needed
      const json: JSONFetchServerReturnTypes = await (async () => {
        if (method === 'GET') {
          const query = args[ 0 ] as any
          const queryString = new URLSearchParams(query).toString()
          const url = `${ baseUrl ?? "" }${ path }?${ queryString }`
          console.log("[jsonfetch] GET request URL:", url)
          const res = await fetch(url)
          return await res.json()
        }
        if (method === "POST") {
          const url = `${ baseUrl ?? "" }${ path }`
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args)
          })
          return await res.json()
        }
        throw 'invalid method'
      })()

      if (json.status === "ok") {
        return _respond.ok(json.data)
      } else if (json.status === "error") {
        return _respond.error(json.errorMsg)
      } else {
        console.log("[jsonfetch] Invalid response format:", json)
        return _respond.error("Invalid response format")
      }

    } catch (error) {
      console.log("[jsonfetch] Fetch error:", error)
      return _respond.fetchError(error instanceof Error ? error.message : String(error))
    }
  }
}



// usage test
async () => {
  const { $JSONFetchRoutesType } = createJsonFetchClient({
    "GET:/fetch-test": (query: { text: string }) => `Echo: ${ query.text }`,
    "GET:/fetch-test2": (query: { text: string }) => 4,
    "POST:/post-test": (a: { hello: "world" }, b: { foo: "bar" }) => [ a, b ],
    "POST:/post-test2": (c: 8) => ({ hello: "world" }),
    "GET:/empty-test": () => { },
    "POST:/empty-post-test": () => { }
  })

  const api = createJsonFetcher<typeof $JSONFetchRoutesType>()

  const res = await api("GET:/fetch-test", { text: "Hello" })
  const res2 = await api("GET:/fetch-test2", { text: "Hello" })
  const res3 = await api("POST:/post-test", { hello: "world" }, { foo: "bar" })
  const res4 = await api("POST:/post-test2", 8)
  // @ts-expect-error "aa" is not a valid method
  const res5 = await api("aa")
  // @ts-expect-error "/asfsag" is not a valid route
  const res6 = await api("GET", "/asfsag")
  // @ts-expect-error invalid input for /fetch-test route
  const res7 = await api("GET", "/fetch-test", { asd: "He2llo" })

  const res8 = await api("GET:/empty-test")
  const res9 = await api("POST:/empty-post-test")

  if (res4.status === "ok") {
    res4.data.hello
  }

}