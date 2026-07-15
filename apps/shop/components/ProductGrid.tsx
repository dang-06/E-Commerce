'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'
import { VI_COPY } from '@/lib/constants'

interface ProductGridProps {
  products: Product[]
  isPromotionEligible: boolean
  onAddToCart?: (productId: string, quantity: number) => void
  isLoading?: boolean
}

export default function ProductGrid({
  products,
  isPromotionEligible,
  onAddToCart,
  isLoading = false,
}: ProductGridProps) {
  const [recentlyAdded, setRecentlyAdded] = useState<string>('')

  const handleAddToCart = (productId: string, quantity: number) => {
    if (!onAddToCart) return
    onAddToCart(productId, quantity)
    setRecentlyAdded(productId)
    setTimeout(() => setRecentlyAdded(''), 2000)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground font-semibold mb-2">
          {VI_COPY.noProducts}
        </p>
        <p className="text-muted-foreground">{VI_COPY.loading}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isPromotionEligible={isPromotionEligible}
            onAddToCart={(quantity) => handleAddToCart(product.id, quantity)}
          />
        ))}
      </div>

      {/* Recently Added Toast */}
      {recentlyAdded && (
        <div className="fixed bottom-4 right-4 bg-secondary text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {VI_COPY.addedToCart}
        </div>
      )}
    </>
  )
}
