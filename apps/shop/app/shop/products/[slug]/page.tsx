'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Minus, ShoppingCart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProductBySlug, getRelatedProducts } from '@/lib/services/productService'
import { useCart } from '@/hooks/useCart'
import { usePromotion } from '@/hooks/usePromotion'
import type { Product } from '@/lib/types'
import { formatVND, calculatePromotionDiscount } from '@/lib/utils'
import { VI_COPY, PROMOTION_CONFIG } from '@/lib/constants'

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const { isEligible } = usePromotion()
  const { addToCart } = useCart()

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    const loadProduct = async () => {
      try {
        const [productData, relatedData] = await Promise.all([
          getProductBySlug(slug),
          getProductBySlug(slug).then((p) => (p ? getRelatedProducts(p.id, 4) : [])),
        ])

        if (productData) {
          setProduct(productData)
          setRelatedProducts(relatedData)
        } else {
          router.push('/shop')
        }
      } catch (error) {
        console.error('Failed to load product:', error)
        router.push('/shop')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [slug, router])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground font-semibold mb-4">Không tìm thấy sản phẩm</p>
        <Link href="/shop" className="text-primary hover:underline">
          Quay lại cửa hàng
        </Link>
      </div>
    )
  }

  const promotionalPrice = product.listedPrice - PROMOTION_CONFIG.discountPerUnit
  const discount = PROMOTION_CONFIG.discountPerUnit
  const displayPrice = isEligible ? promotionalPrice : product.listedPrice

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    addToCart(product.id, quantity)
    setTimeout(() => {
      setIsAddingToCart(false)
      setQuantity(1)
    }, 1000)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:underline mb-8 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden h-96 md:h-full">
          <Image
            src={product.image}
            alt={product.name}
            width={500}
            height={500}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category & SKU */}
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase mb-2">
              {product.category}
            </p>
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {product.name}
          </h1>

          {/* Description */}
          <p className="text-foreground leading-relaxed">{product.description}</p>

          {/* Pricing Section */}
          <div className="border-t border-b border-border py-6 space-y-3">
            {isEligible ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-lg line-through text-muted-foreground">
                    {formatVND(product.listedPrice)}
                  </span>
                  <span className="bg-secondary text-white text-sm px-3 py-1 rounded font-bold">
                    {VI_COPY.discount} {formatVND(discount)}
                  </span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {formatVND(promotionalPrice)}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {formatVND(product.listedPrice)}
              </p>
            )}
            {isEligible && (
              <p className="text-sm text-secondary font-medium">
                ✓ Bạn được áp dụng ưu đãi cho sản phẩm này
              </p>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-secondary' : 'bg-destructive'}`} />
            <span className="font-medium text-foreground">
              {product.inStock ? VI_COPY.inStock : VI_COPY.outOfStock}
            </span>
          </div>

          {/* Quantity & Add to Cart */}
          {product.inStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-foreground font-medium">{VI_COPY.quantity}</span>
                <div className="flex items-center gap-2 bg-muted rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-white transition-colors"
                    disabled={isAddingToCart}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-white transition-colors"
                    disabled={isAddingToCart}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {isAddingToCart ? 'Đang thêm...' : VI_COPY.addToCart}
              </button>
            </div>
          )}

          {/* Share Button */}
          <button className="w-full flex items-center justify-center gap-2 border border-border text-foreground px-6 py-2 rounded-lg font-medium hover:bg-muted transition-colors">
            <Share2 className="w-4 h-4" />
            Chia sẻ sản phẩm
          </button>

          {/* Delivery Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold text-foreground">Thông tin giao hàng</p>
            <p className="text-muted-foreground">
              ✓ Giao hàng miễn phí cho đơn hàng trên 500.000đ
            </p>
            <p className="text-muted-foreground">
              ✓ Hoàn trả miễn phí trong 30 ngày
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pb-12">
          <h2 className="text-2xl font-bold text-foreground">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/shop/products/${relatedProduct.slug}`}
                className="group"
              >
                <div className="relative h-32 md:h-40 bg-muted rounded-lg overflow-hidden mb-3">
                  <Image
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm">
                  {relatedProduct.name}
                </p>
                <p className="text-primary font-bold text-sm mt-2">
                  {formatVND(
                    isEligible
                      ? relatedProduct.listedPrice - PROMOTION_CONFIG.discountPerUnit
                      : relatedProduct.listedPrice
                  )}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
