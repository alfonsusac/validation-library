import { AppClientContext, useAppClientStore } from "./use-app-client"
import { TestComponent } from "../AppTest"
import { useListenPackageJson } from "../features/package-json-client"
import { RootLayout } from "./pages/RootLayout"

export function App() {

  const client = useAppClientStore("ws://localhost:3000/ws")
  useListenPackageJson(client)

  return (
    <AppClientContext value={client}>
      <RootLayout>
      </RootLayout>
      <TestComponent />
    </AppClientContext>
  )
}