import type { ReactNode } from "react"

import { Sidebar } from "@/components/sidebar"
import { requireAdmin } from "@/lib/auth"

// Every console page is per-operator and data-driven; never statically cached.
export const dynamic = "force-dynamic"

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-screen">
      <Sidebar admin={admin} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
