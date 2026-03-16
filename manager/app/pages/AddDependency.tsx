export function AddDependencyPage() {
  return (
    <div className="flex flex-col gap-12 py-4 pb-20">

    </div>
  )
}

// Add Dependency Page
// - Source Type:
//   [npm | git | github | local]
//   - npm: 
//     - search npm keywords
//     - list of matching packages: name, description, latest version, weekly download count
//     - version range
//       - autofill: [latest | tags (latest, next, etc.)]
//     - is aliased checkbox
// - Dependency Type:
//   [Dependency | Dev Dependency | Peer Dependency | Optional Dependency]