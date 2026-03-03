import { jsonCodec, wsFileWatcher } from "../lib/ws-file-watcher"


export const repository = {
  packageJson: wsFileWatcher("./package.json", jsonCodec()),
  userSettings: wsFileWatcher("./manager/settings.json", jsonCodec()),
}