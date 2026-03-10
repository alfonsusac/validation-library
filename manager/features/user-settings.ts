import { EventEmitter, RPCMethods, type EventPublisherFn } from "../lib/ws2-core"
import { JSONFileController } from "../lib/file-controller"

export type UserSettings = {
  checkProjectNameOnNPM: boolean,
  route: string
}

export async function UserSettings(
  publisherFn: EventPublisherFn
) {
  const file = JSONFileController<UserSettings>('./manager/settings.json', {
    onNotExist: async (file) => {
      const defaultSettings: UserSettings = {
        checkProjectNameOnNPM: false,
        route: "/"
      }
      await file.write(JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }
  })
  const publisher = EventEmitter<{
    'user-settings-updated': UserSettings
  }>(publisherFn)

  const methods = RPCMethods({
    "getUserSettings": async () => { return file.get() },
    "updateUserSettings": async (newData: Partial<UserSettings>) => {
      const currentData = file.get()
      const updatedData = { ...currentData, ...newData }
      await file.set(updatedData)
    }
  })
  await file.initialize()
  file.subscribe(content => publisher.publish("user-settings-updated", content))
  return {
    methods: methods,
    events: publisher.events,
    cleanup() { file.cleanup() }
  }
}