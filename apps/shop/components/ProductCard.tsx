'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { formatVND } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  isPromotionEligible: boolean
  onAddToCart?: (quantity: number) => void
}

export default function ProductCard({
  product,
  isPromotionEligible,
  onAddToCart,
}: ProductCardProps) {
  const discountPerUnit = 25000
  const promotionalPrice = product.listedPrice - discountPerUnit

  return (
    <Link href={`/shop/products/${product.slug}`}>
      <div className="flex flex-col gap-0 bg-white cursor-pointer group">
        {/* Product Image Container */}
        <div className="relative w-full aspect-square bg-muted overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-8 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Discount Badge - Red like reference */}
          {product.discount > 0 && (
            <div className="absolute top-4 left-4 bg-accent text-white px-3 py-1.5 text-sm font-bold">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Price Section */}
          <div>
            {isPromotionEligible ? (
              <div className="flex items-center gap-3">
                <span className="text-sm line-through text-muted-foreground">
                  {formatVND(product.listedPrice)}
                </span>
                <span className="text-lg font-bold text-accent">
                  {formatVND(promotionalPrice)}
                </span>
              </div>
            ) : (
              <p className="text-lg font-bold text-foreground">
                {formatVND(product.listedPrice)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
