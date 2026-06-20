import type { ReactNode } from "react"

// Preview pages are self-contained — they override the root layout's header
// and global styles with their own design system.
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
