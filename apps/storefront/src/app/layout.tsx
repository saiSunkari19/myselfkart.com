import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"

export const metadata: Metadata = {
  title: "Selfkart Storefront",
  description: "Multi-tenant storefront powered by Medusa + Neon RLS",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/">Shop</a>
          <a href="/cart">Cart</a>
        </header>
        {children}
      </body>
    </html>
  )
}
