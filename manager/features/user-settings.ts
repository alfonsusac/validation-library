import { createTextFileWatcher } from "../lib/core-file-watcher"
import { wsplugin } from "../lib/websocket-plugin"

export const userSettings = {
  fileWatcher: createTextFileWatcher('./manager/settings.json', {
    decode: async file => {
      try {
        return JSON.parse(await file.text())
      } catch (error) {
        file.write("{}") // if file is not a valid JSON, reset it to empty object
        console.warn(`[event-user-settings]: Error parsing settings.json, resetting to empty object.`)
        return {}
      }
    },
    encode: async data => JSON.stringify(data)
  }),

  websocketPlugin: wsplugin({
    name: "user-settings",
    broadcasts: {
      "updated:user-settings": (content: Record<string, unknown>) => content
    },
    rpcs: {
      getUserSettings: () => userSettings.fileWatcher.read(),
      updateUserSettings: async (ws, newData: Record<string, unknown>) => {
        await userSettings.fileWatcher.write(newData)
      }
    },
    onServe(server) {
      userSettings.fileWatcher.onChange(content => {
        server.broadcast("updated:user-settings", content)
      })
    }
  })
}

export type UserSettingsSchema = typeof userSettings.websocketPlugin.$schema
