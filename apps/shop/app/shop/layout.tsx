'use client'

import { useState, useEffect } from 'react'
import { usePromotion } from '@/hooks/usePromotion'
import { useCart } from '@/hooks/useCart'
import { getProducts } from '@/lib/services/productService'
import type { Product } from '@/lib/types'
import CartDrawer from '@/components/CartDrawer'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isEligible, promoPhone } = usePromotion()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { totalQuantity, addToCart, removeFromCart, updateQuantity, clearCart } = useCart(products)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts()
        setProducts(data)
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <CartDrawer 
        isEligible={isEligible} 
        promoPhone={promoPhone}
      />
    </div>
  )
}
