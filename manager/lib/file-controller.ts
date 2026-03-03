import * as fs from 'fs'
import { EventListener } from './util-listener'

export async function textFileController(
  path: `./${ string }`,
  deps: {
    publish: (data: string) => void,
  }
) {
  const file = Bun.file(path)
  const emitter = new EventListener<{ update: [ string ], }>()
  const watcher = watch()
  let content: string
  readFile().then((res) => content = res)

  function readFile() {
    return file.text()
  }
  function writeFile(content: string) {
    return file.write(content)
  }
  function watch() {
    return fs.watch(path, async (evType) => {
      if (evType !== "change") return
      const newContent = await readFile()
      content = newContent
      deps.publish(newContent)
      emitter.emit('update', newContent)
    })
  }
  function update(newContent: string) {
    if (newContent !== content) {
      file.write(newContent)
      content = newContent
      emitter.emit('update', newContent)
    }
  }
  function dispose() {
    emitter.clear()
    watcher.close()
  }

  return {
    update,
    dispose,
  }


}