import type { PluginSchema } from "./websocket-plugin"



function clientWSHandler(opts: {
  // A way for the client to emit events.
  emit: (N: string, data: any) => void,
  // A way for the client to 
  handleMessage: (message: string | Buffer<ArrayBuffer>, handlers: {
    [ N in keyof PluginSchema[ "rpcs" ] ]: (...args: Parameters<PluginSchema[ "rpcs" ][ N ]>) => void
  }) => void,
}) {

}












export function clientWsPlugin<S extends PluginSchema>() {

  // What the client allowed to emit with
  //  respect to the plugin schema.
  function emit<N>() {

  }


}