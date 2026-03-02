// Must run with bun run --hot to enable HMR

import { startManager } from "./manager/Server"

export const { 
  $JSONFetchRoutesType,
} = await startManager()