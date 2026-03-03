type ManagerAppSettings = {
  checkNameAvailability: boolean
}


export async function getSettings() {
  const json = await Bun.file("./manager/settings.bin").json() as ManagerAppSettings
  return json
}

export async function saveSettings(newValue: Partial<ManagerAppSettings>) {
  const prev = await getSettings()
  const newSettings = { ...prev, ...newValue }
  await Bun.write("./manager/settings.bin", JSON.stringify(newSettings))
}