"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

export type CartItem = {
  eventId: string
  eventTitle: string
  eventImage: string
  eventDate: string
  eventVenue: string
  eventCity: string
  type: string
  price: number
  quantity: number
}

type CartCtx = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  updateQty: (eventId: string, type: string, delta: number) => void
  removeItem: (eventId: string, type: string) => void
  clear: () => void
  totalItems: number
  subtotal: number
}

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([
    // Pre-seeded so cart isn't empty on first visit
    {
      eventId: "e1",
      eventTitle: "Sunburn Festival 2025",
      eventImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
      eventDate: "Dec 28–30, 2025",
      eventVenue: "Vagator Beach, Goa",
      eventCity: "Goa",
      type: "General Admission",
      price: 2499,
      quantity: 2,
    },
    {
      eventId: "e1",
      eventTitle: "Sunburn Festival 2025",
      eventImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
      eventDate: "Dec 28–30, 2025",
      eventVenue: "Vagator Beach, Goa",
      eventCity: "Goa",
      type: "VIP",
      price: 5999,
      quantity: 1,
    },
  ])

  const addItem = useCallback((incoming: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = incoming.quantity ?? 1
    setItems(prev => {
      const idx = prev.findIndex(i => i.eventId === incoming.eventId && i.type === incoming.type)
      if (idx >= 0) {
        return prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + qty } : item)
      }
      return [...prev, { ...incoming, quantity: qty }]
    })
  }, [])

  const updateQty = useCallback((eventId: string, type: string, delta: number) => {
    setItems(prev =>
      prev
        .map(item => item.eventId === eventId && item.type === type
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
        )
        .filter(item => item.quantity > 0)
    )
  }, [])

  const removeItem = useCallback((eventId: string, type: string) => {
    setItems(prev => prev.filter(i => !(i.eventId === eventId && i.type === type)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <Ctx.Provider value={{ items, addItem, updateQty, removeItem, clear, totalItems, subtotal }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useCart must be inside CartProvider")
  return ctx
}
