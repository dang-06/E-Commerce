'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { getProducts } from '@/lib/services/productService'
import { formatVND, calculatePromotionDiscount } from '@/lib/utils'
import { VI_COPY, PROMOTION_CONFIG } from '@/lib/constants'
import type { Product } from '@/lib/types'

interface CartDrawerProps {
  isEligible: boolean
  promoPhone?: string
}

export default function CartDrawer({ isEligible, promoPhone }: CartDrawerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    cartItems,
    items,
    totalQuantity,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart(products)

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

  const discount = isEligible ? calculatePromotionDiscount(totalQuantity) : 0
  const shippingFee = PROMOTION_CONFIG.shippingFee
  const total = subtotal - discount + shippingFee

  const handleCheckout = () => {
    setIsOpen(false)
    router.push('/checkout')
  }

  return (
    <>
      {/* Mobile Sticky Bottom Bar */}
      {totalQuantity > 0 && !isOpen && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-border">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">{formatVND(total)}</span>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded font-semibold text-sm hover:bg-primary/90"
            >
              {VI_COPY.checkout}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Drawer */}
      <div
        className={`fixed right-0 top-0 h-screen w-full max-w-sm bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } hidden md:flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-foreground">{VI_COPY.cart}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="font-semibold text-foreground mb-2">
                {VI_COPY.cartEmpty}
              </p>
              <p className="text-sm text-muted-foreground">
                {VI_COPY.cartEmptyMessage}
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-primary text-white px-6 py-2 rounded font-semibold hover:bg-primary/90"
              >
                {VI_COPY.continueShopping}
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="border border-border rounded-lg p-3">
                <Link
                  href={`/shop/products/${item.product?.slug}`}
                  className="text-sm font-semibold text-foreground hover:text-primary line-clamp-2 mb-2"
                >
                  {item.product?.name || 'Product'}
                </Link>

                <div className="space-y-2">
                  <div className="text-sm">
                    {isEligible ? (
                      <>
                        <span className="text-xs line-through text-muted-foreground">
                          {formatVND(item.listedPrice)}
                        </span>
                        <span className="ml-2 font-semibold text-primary">
                          {formatVND(item.listedPrice - 25000)}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {formatVND(item.listedPrice)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-muted rounded">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="p-1 hover:bg-white transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="p-1 hover:bg-white transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-foreground">
                <span>{VI_COPY.subtotal}</span>
                <span className="font-semibold">{formatVND(subtotal)}</span>
              </div>

              {isEligible && discount > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>{VI_COPY.customerDiscount}</span>
                  <span className="font-semibold">-{formatVND(discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-foreground">
                <span>{VI_COPY.shippingFee}</span>
                <span className="font-semibold">{formatVND(shippingFee)}</span>
              </div>

              <div className="flex justify-between border-t border-border pt-2 text-foreground font-bold">
                <span>{VI_COPY.totalPayment}</span>
                <span className="text-lg text-primary">{formatVND(total)}</span>
              </div>
            </div>

            {isEligible && (
              <p className="text-xs text-secondary bg-secondary/10 p-2 rounded">
                ✓ Ưu đãi: {formatVND(discount)} (tiết kiệm {VI_COPY.discount})
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full bg-primary text-white px-4 py-3 rounded font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {VI_COPY.checkout}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full border border-border text-foreground px-4 py-2 rounded font-semibold hover:bg-muted transition-colors"
            >
              {VI_COPY.continueShopping}
            </button>
          </div>
        )}
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sheet Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 z-40"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalQuantity > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold">
            {totalQuantity > 9 ? '9+' : totalQuantity}
          </span>
        )}
      </button>
    </>
  )
}
