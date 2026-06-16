"use client"

import { Inbox, LayoutDashboard, LogOut, Store } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { logoutAction } from "@/actions/auth"
import type { PlatformAdmin } from "@/lib/types"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Inbox },
  { href: "/tenants", label: "Tenants", icon: Store },
]

export function Sidebar({ admin }: { admin: PlatformAdmin }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-6 py-6">
        <div className="text-headline tracking-tight">Selfkart</div>
        <p className="mt-0.5 text-xs text-ink-subtle">Platform console</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-surface-2 text-ink"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon className="size-4" strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-line px-3 py-4">
        <div className="px-3 pb-3">
          <p className="truncate text-sm text-ink">{admin.name}</p>
          <p className="truncate text-xs text-ink-subtle">{admin.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogOut className="size-4" strokeWidth={2} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
