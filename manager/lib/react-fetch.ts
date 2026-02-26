import { useTransition } from "react"

// export function useFetch(url: string, ) {

//   const [ pending, startTransition ] = useTransition()

//   function trigger() {
//     startTransition(async () => {
//       await fetch(url)
//     })
//   }

//   return [ pending, trigger ] as const
// }