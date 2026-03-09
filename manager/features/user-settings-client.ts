import { useSyncExternalStore } from "react"
import { call, useAppClient } from "../app/use-app-client"
import type { UserSettings } from "./user-settings"

export function useUserSettings() {
  const client = useAppClient(true)
  const store = client.createOrRetrieveStore<UserSettings>("userSettings", async () => {
    client.subscribe("user-settings-updated", (data) => store.update(data))
    const res = await call("getUserSettings")
    return res
  })
  const userSettings = useSyncExternalStore(
    store.subscribe,
    store.get,
  )!

  async function update(cb: (prev: UserSettings) => UserSettings) {
    const prev = store?.get()
    if (!prev) return console.log("Update failed")
    const newData = cb(prev)
    await call("updateUserSettings", newData)
    store?.update(newData)
  }

  return { userSettings, updateUserSettings: update, subscribeStoreSettings: store.subscribe }
}
