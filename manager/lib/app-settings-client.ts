import { fetchServer } from "../App"
import { useAsync } from "./react-async"

export function useAppSettings() {

  const [ settings, isLoading ] = useAsync(async () => {
    return await fetchServer("GET:/settings")
  }, [])

  


}