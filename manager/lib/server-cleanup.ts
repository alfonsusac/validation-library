export function onExit(callback: () => void) {
  process.on("exit", callback)
  process.on("SIGINT", () => {
    console.log("\nExiting...")
    callback()
    process.exit(0)
  })
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err)
    callback()
    process.exit(1)
  })
}