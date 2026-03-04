import { fileWatcher } from '../lib/ws-file-watcher'
import { wsplugin } from '../lib/websocket-plugin'
import { RPCFetchHandlers, EventPublisher, type AppServer, type ServerEventPublisher, type ServerPublisher, type Publishings, type RPCMethods } from '../lib/ws2-core'
import { WatchJsonFile } from '../lib/file-controller'

export type PackageJson = {
  name: string,
  version: string,
  description?: string,
  keywords?: string[],
  homepage?: string,
  bugs?: {
    url?: string,
    email?: string,
  } | string,
  dependencies?: Record<string, string>,
  devDependencies?: Record<string, string>,
}



// export type PackageJsonEventSchema = typeof packageJson.websocketPlugin.$schema







