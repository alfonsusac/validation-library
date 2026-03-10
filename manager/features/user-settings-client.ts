import { call, useAppClient } from "../app/app-client"
import type { UserSettings } from "./user-settings"
import { useQuery } from "../lib/react-store"

export function useUserSettings() {
  const client = useAppClient()
  const [ settings, updateSettingStore ] = useQuery(
    "userSettings", async (clean) => {
      clean(client.subscribe("user-settings-updated", data => updateSettingStore(data)))
      return await call("getUserSettings")
    })
  async function update(payload: Partial<UserSettings>) {
    if (!settings) return console.log("Update failed: settings not loaded yet")
    call("updateUserSettings", payload)
  }
  return [ settings, update ] as const
}
