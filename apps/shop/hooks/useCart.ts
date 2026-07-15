'use client'

import { useCallback, useMemo } from 'react'
import type { CartItem, Product } from '@/lib/types'
import { useLocalStorage } from './useLocalStorage'

/**
 * Hook for managing shopping cart with localStorage persistence
 */
export function useCart(products: Product[] = []) {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>('cart', [])

  const addToCart = useCallback(
    (productId: string, quantity: number = 1) => {
      setCartItems((items) => {
        const existingItem = items.find((i) => i.productId === productId)
        if (existingItem) {
          return items.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
          )
        }
        return [...items, { productId, quantity, addedAt: Date.now() }]
      })
    },
    [setCartItems]
  )

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId)
        return
      }
      setCartItems((items) =>
        items.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      )
    },
    [setCartItems]
  )

  const removeFromCart = useCallback(
    (productId: string) => {
      setCartItems((items) => items.filter((i) => i.productId !== productId))
    },
    [setCartItems]
  )

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [setCartItems])

  // Compute cart totals
  const cartDetails = useMemo(() => {
    const items = cartItems.map((cartItem) => {
      const product = products.find((p) => p.id === cartItem.productId)
      return {
        ...cartItem,
        product,
        listedPrice: product?.listedPrice ?? 0,
      }
    })

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce(
      (sum, item) => sum + item.listedPrice * item.quantity,
      0
    )

    return {
      items,
      totalQuantity,
      subtotal,
      isEmpty: items.length === 0,
    }
  }, [cartItems, products])

  return {
    cartItems,
    ...cartDetails,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }
}
