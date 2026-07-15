'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft } from 'lucide-react'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    slug: '',
    shortDescription: '',
    description: '',
    listedPrice: '',
    discountAmount: '',
    category: '',
    stock: '',
    isPromotionEligible: true,
    isActive: true,
  })

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      // Mock submit
      await new Promise((resolve) => setTimeout(resolve, 500))
      router.push('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Tổng quan', href: '/admin' },
          { label: 'Sản phẩm', href: '/admin/products' },
          { label: 'Thêm mới' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thêm sản phẩm mới</h1>
          <p className="mt-1 text-muted-foreground">Tạo một sản phẩm mới cho cửa hàng</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Tên sản phẩm</Label>
                  <Input
                    id="name"
                    placeholder="VD: Laptop Dell XPS 13"
                    value={formData.name}
                    onChange={(e) =>
                      { setFormData({ ...formData, name: e.target.value }); }
                    }
                    required
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="VD: LAP-001"
                      value={formData.sku}
                      onChange={(e) =>
                        { setFormData({ ...formData, sku: e.target.value }); }
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Danh mục</Label>
                    <Input
                      id="category"
                      placeholder="VD: Máy tính"
                      value={formData.category}
                      onChange={(e) =>
                        { setFormData({ ...formData, category: e.target.value }); }
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shortDescription">Mô tả ngắn</Label>
                  <Input
                    id="shortDescription"
                    placeholder="Tóm tắt sản phẩm"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      { setFormData({
                        ...formData,
                        shortDescription: e.target.value,
                      }); }
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Mô tả chi tiết</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả đầy đủ về sản phẩm"
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      { setFormData({ ...formData, description: e.target.value }); }
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Pricing */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Giá bán</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="listedPrice">Giá gốc (VND)</Label>
                  <Input
                    id="listedPrice"
                    type="number"
                    placeholder="0"
                    value={formData.listedPrice}
                    onChange={(e) =>
                      { setFormData({ ...formData, listedPrice: e.target.value }); }
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="discountAmount">Giảm giá ưu đãi (VND)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    placeholder="0"
                    value={formData.discountAmount}
                    onChange={(e) =>
                      { setFormData({
                        ...formData,
                        discountAmount: e.target.value,
                      }); }
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nhập 25000 để giảm 25,000 ₫ cho khách hàng ưu đãi
                  </p>
                </div>
              </div>
            </Card>

            {/* Stock */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Tồn kho</h2>
              <div>
                <Label htmlFor="stock">Số lượng tồn kho</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) =>
                    { setFormData({ ...formData, stock: e.target.value }); }
                  }
                />
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} size="lg">
                {loading ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </Button>
              <Link href="/admin/products">
                <Button variant="outline" size="lg">
                  Hủy
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Cấu hình</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPromotionEligible"
                  checked={formData.isPromotionEligible}
                  onCheckedChange={(checked) =>
                    { setFormData({
                      ...formData,
                      isPromotionEligible: checked,
                    }); }
                  }
                />
                <Label htmlFor="isPromotionEligible" className="cursor-pointer">
                  Áp dụng ưu đãi
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    { setFormData({ ...formData, isActive: checked }); }
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Kích hoạt sản phẩm
                </Label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
