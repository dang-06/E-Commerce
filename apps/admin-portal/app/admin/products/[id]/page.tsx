'use client'

import { useEffect, useState, type SyntheticEvent } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, EyeOff, Save } from 'lucide-react'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { productService } from '@/lib/services/api-service'
import type { Product } from '@/lib/types'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = String(params.id)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadProduct() {
      try {
        setProduct(await productService.getProductById(productId))
      } finally {
        setLoading(false)
      }
    }
    void loadProduct()
  }, [productId])

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product) {
      return
    }
    setSaving(true)
    try {
      await productService.updateProduct(product.id, product)
      setMessage('Đã lưu sản phẩm.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Đang tải sản phẩm...</div>
  }

  if (!product) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-destructive">Không tìm thấy sản phẩm.</p>
        <Link href="/admin/products">
          <Button>Quay lại</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <Breadcrumbs
        items={[
          { label: 'Tổng quan', href: '/admin' },
          { label: 'Sản phẩm', href: '/admin/products' },
          { label: product.name },
        ]}
      />

      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sửa sản phẩm</h1>
          <p className="text-muted-foreground">{product.sku}</p>
        </div>
      </div>

      {message ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div> : null}

      <form
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <Card className="space-y-4 p-6 lg:col-span-2">
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input
              id="name"
              value={product.name}
              onChange={(event) => {
                setProduct({ ...product, name: event.target.value })
              }}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={product.sku}
                onChange={(event) => {
                  setProduct({ ...product, sku: event.target.value })
                }}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={product.slug}
                onChange={(event) => {
                  setProduct({ ...product, slug: event.target.value })
                }}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="listedPrice">Giá niêm yết</Label>
              <Input
                id="listedPrice"
                type="number"
                value={product.listedPrice}
                onChange={(event) => {
                  setProduct({ ...product, listedPrice: Number(event.target.value) })
                }}
              />
            </div>
            <div>
              <Label htmlFor="discountAmount">Giảm giá</Label>
              <Input
                id="discountAmount"
                type="number"
                value={product.discountAmount}
                onChange={(event) => {
                  setProduct({ ...product, discountAmount: Number(event.target.value) })
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="promotion"
              checked={product.isPromotionEligible}
              onCheckedChange={(checked) => {
                setProduct({ ...product, isPromotionEligible: checked })
              }}
            />
            <Label htmlFor="promotion">Áp dụng ưu đãi</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={product.isActive}
              onCheckedChange={(checked) => {
                setProduct({ ...product, isActive: checked, visibility: checked ? 'visible' : 'hidden' })
              }}
            />
            <Label htmlFor="active">Hiển thị sản phẩm</Label>
          </div>
          <Button type="submit" disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full gap-2"
            onClick={() => {
              if (window.confirm('Ẩn sản phẩm này? Không xóa cứng sản phẩm đã có đơn.')) {
                setProduct({ ...product, isActive: false, visibility: 'hidden' })
                router.refresh()
              }
            }}
          >
            <EyeOff className="h-4 w-4" />
            Ẩn sản phẩm
          </Button>
        </Card>
      </form>
    </div>
  )
}
