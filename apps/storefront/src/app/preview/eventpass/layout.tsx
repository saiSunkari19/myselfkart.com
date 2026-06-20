import { CartProvider } from "./_cart"

export default function EventPassLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}
