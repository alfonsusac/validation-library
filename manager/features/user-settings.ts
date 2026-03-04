import { RPCMethods, type EventPublisherFn } from "../lib/ws2-core"
import { WatchJsonFile } from "../lib/file-controller"

export type UserSettings = {
  checkProjectNameOnNPM: boolean
}

export function UserSettings() {
  const file = WatchJsonFile<UserSettings>('./manager/settings.json', {
    onNotExist: async (file) => {
      const defaultSettings: UserSettings = {
        checkProjectNameOnNPM: false
      }
      await file.write(JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }
  })
  const methods = RPCMethods({
    "getUserSettings": async () => { return file.get() },
    "updateUserSettings": async (newData: UserSettings) => { await file.set(newData) }
  })
  file.initialize()
  return {
    methods: methods,
    cleanup() { file.cleanup() }
  }
}