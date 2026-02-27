// A custom rpc client that uses jsonfetch to call server routes. 
//  The server routes are defined in a JSONFetchRoutes object, 
//  which maps route names to handler functions.The client will 
//  call the appropriate handler function based on the route 

import { jfetch } from "./fetch"

//  name and arguments passed in.
type JSONFetchRoutes<
  G extends { [ key: string ]: string } = any,
  P extends any[] = any[],
> = {
  [ key: `GET:${ string }` ]: (query: G) => any,
  [ key: `POST:${ string }` ]: (...argsAsBody: P) => any
}


export type JSONFetchServerReturnTypes<T> = {
  status: "ok",
  data: T
} | {
  status: "error",
  errorMsg: string
} | {
  status: "invalid_request",
  errorMsg: string
}

const _Response = {
  ok: <T>(result: any) => new Response(
    JSON.stringify({ status: "ok", data: result } satisfies JSONFetchServerReturnTypes<T>),
    { headers: { "Content-Type": "application/json" } }
  ),
  // This is for unnkown errors that occurs during route handling, 
  //  such as exceptions thrown by the handler function.
  // Client will receive a generic "Server error occured" message,
  //  and should not rely on the error message for any logic.
  // If you want to send known errors with specific messages, use the
  //  ok response with a specific data structure that indicates an error,
  //  since it is implemented with a generic type T. 
  error: <T>(error: any) => {
    console.log(`[jsonfetch.error] Route handler error:`, error)
    return new Response(
      JSON.stringify({ status: "error", errorMsg: error instanceof Error ? error.message : String(error) } satisfies JSONFetchServerReturnTypes<T>),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    )
  },
  // This is for handling invalid requests, such as invalid query on GET or 
  //  invalid body on POST. This error is intended to indicate a bug 
  //  in the client implementation.
  // In the client, it will throw error since ideally client-server contract
  //  should ensure that args passed should be valid. Otherwise, it indicates a
  //  bug in the implementation of fetch-schema.ts.
  invalidRequest: <T>(errorMsg: string) => {
    console.log(`[jsonfetch.invalidRequest] Invalid request: ${ errorMsg }`)
    return new Response(
      JSON.stringify({ status: "invalid_request", errorMsg } satisfies JSONFetchServerReturnTypes<T>),
      { headers: { "Content-Type": "application/json" }, status: 400 }
    )
  }
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
  return async function serverFetch<R extends GetRouteNames<S>>(
    route: R,
    ...args: GetRouteArgsFromName<S, R>
  ) {
    type ServerFetchReturnType = JSONFetchServerReturnTypes<Awaited<GetRouteReturnTypeFromName<S, R>>>

    const [ method, path ] = route.split(":") as [ method: "GET" | "POST", path: string ]

    const res = await (async () => {
      if (method === "GET") {
        const queryString = new URLSearchParams(args[ 0 ] as any).toString()
        const url = `${ baseUrl ?? "" }${ path }?${ queryString }`
        return await jfetch<ServerFetchReturnType>(url)
      }
      if (method === "POST") {
        const url = `${ baseUrl ?? "" }${ path }`
        return await jfetch<ServerFetchReturnType>(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args)
        })
      }
      throw new Error(`Invalid method: ${ method } in route: ${ route }`)
    })()

    if (res.status === "fetch error") {
      console.error(`[jsonfetch-client] Fetch error on route ${ route }:`, res.message)
      throw new Error(`Unable to fetch.`)
    }
    if (res.json.status === "parse error") {
      console.error(`[jsonfetch-client] Parse error on route ${ route }:`, res.json.message)
      throw new Error(`Unable to parse data.`)
    }
    if (res.json.jsondata.status === "invalid_request")
      throw new Error(`Invalid request: ${ res.json.jsondata.errorMsg }. 
Route: ${ route }, 
Args: ${ JSON.stringify(args) }
`)
    if (res.json.jsondata.status === "error")
      throw new Error(`Server error occured.`)
    // do not expose server error message to client since it may contain sensitive info. Client should rely on error status for logic, and treat all error messages as generic "Server error occured".

    return res.json.jsondata.data
    // In this setup, server lives closely to client, and they are developeed
    //  together. So we can ensure the following things:
    // - fetch never errors with network error,
    //    since server is always available.
    // - server will always return a valid JSON response with the
    //    specified format, so we can safely parse it without try-catch,
    //    and rely on the type system to ensure we handle all possible
    //    cases of the response.
    // - the client will always send the correct arguments as specified
    //    in the route handler type, so we can rely on the type system
    //    to ensure the correctness of the request, and server will not
    //    need to do extra validation on the input.
    // This allows us to have a very simple and efficient client
    //  implementation without worrying about network errors, invalid
    //  responses, or input validation, while still having strong type
    //  safety and clear error handling for server - side errors and
    //  invalid requests.
    
    // For exercise purposes, if the environments are separated, then
    //  the following things may need to be implemented:
    // - network error handling on client,
    // - retry mechanism.
    // - timeout mechanism
    // - validate server input on server
    // - validate server returns on client
    // - parser error and invalid request args and returns can still be
    //    obfuscated to "invalid requests". but network errors should
    //    still be separated since it can let user know on what to do.
    // - caching!
  }
}



// usage test
async function __test() {
  const { $JSONFetchRoutesType } = createJsonFetchClient({
    "GET:/fetch-test": (query: { text: string }) => `Echo: ${ query.text }`,
    "GET:/fetch-test2": (query: { text: string }) => 4,
    "POST:/post-test": (a: { hello: "world" }, b: { foo: "bar" }) => [ a, b ],
    "POST:/post-test2": (c: 8) => ({ hello: "world" }),
    "GET:/empty-test": () => 8,
    "POST:/empty-post-test": () => ""
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

  res8.toExponential
  // if (res8.json.status === "ok") {
  //   if (res8.json.jsondata.status === "ok") {
  //     const data = res8.json.jsondata.data
  //     console.log("Data: ", data) // should be 8
  //   }
  // }
}