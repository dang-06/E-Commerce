'use client'

import { useState, useEffect } from 'react'
import { usePromotion } from '@/hooks/usePromotion'
import { useCart } from '@/hooks/useCart'
import { getProducts, searchProducts } from '@/lib/services/productService'
import type { Product } from '@/lib/types'
import ProductGrid from '@/components/ProductGrid'
import PromotionStatusBadge from '@/components/PromotionStatusBadge'
import { VI_COPY } from '@/lib/constants'
import { Search } from 'lucide-react'

export default function ShopPage() {
  const { isEligible, promoPhone, clearPromotion } = usePromotion()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const { addToCart } = useCart(products)

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts()
        setProducts(data)
        setFilteredProducts(data)
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Filter products
  useEffect(() => {
    let results = [...products]

    // Filter by search query
    if (searchQuery.trim()) {
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory) {
      results = results.filter((p) => p.category === selectedCategory)
    }

    setFilteredProducts(results)
  }, [searchQuery, selectedCategory, products])

  // Get unique categories
  const categories = Array.from(new Set(products.map((p) => p.category)))

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="space-y-3 border-b border-border pb-4">
        <div className="text-xs text-muted-foreground">
          Trang chủ / <span className="font-semibold text-foreground">Nhân hiệu</span> / Dior
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Hiển thị 1-20 của {products.length} kết quả</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground">Show : <span className="font-semibold">15</span> / 25 / 35</span>
            <select className="border border-border px-3 py-1 text-sm bg-white text-foreground cursor-pointer">
              <option>Sắp xếp theo mới nhất</option>
              <option>Giá: Thấp đến Cao</option>
              <option>Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotion Status */}
      {promoPhone && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <PromotionStatusBadge isEligible={isEligible} phone={promoPhone} />
          {!isEligible && (
            <button
              onClick={clearPromotion}
              className="text-xs text-primary hover:underline font-medium"
            >
              Kiểm tra lại
            </button>
          )}
        </div>
      )}

      {/* Product Grid */}
      <div>
        <ProductGrid
          products={filteredProducts}
          isPromotionEligible={isEligible}
          onAddToCart={(productId, quantity) => {
            addToCart(productId, quantity)
          }}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
