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
import { getErrorMessage, productService } from '@/lib/services/api-service'
import { slugifyVietnamese } from '@/lib/utils/vietnamese'

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
    image: '',
    stock: '',
    isPromotionEligible: true,
    isActive: true,
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState('')
  const [formError, setFormError] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  async function handleImageUpload(file: File | undefined) {
    if (!file) {
      return
    }
    setUploadingImage(true)
    setImageError('')
    try {
      const uploaded = await productService.uploadProductImage(file)
      setFormData((current) => ({ ...current, image: uploaded.imageUrl }))
    } catch (error) {
      console.error(error)
      setImageError('Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFormError('')

    try {
      const slug = formData.slug.trim() || slugifyVietnamese(formData.name)
      await productService.createProduct({
        category: formData.category.trim(),
        description: formData.description.trim(),
        discountAmount: Number(formData.discountAmount || 0),
        image: formData.image,
        isActive: formData.isActive,
        isPromotionEligible: formData.isPromotionEligible,
        listedPrice: Number(formData.listedPrice || 0),
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim(),
        sku: formData.sku.trim(),
        slug,
        sortOrder: 0,
        stock: formData.stock ? Number(formData.stock) : undefined,
        visibility: formData.isActive ? 'visible' : 'hidden',
      })
      router.push('/admin/products')
    } catch (error) {
      setFormError(getErrorMessage(error))
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

      {formError ? (
        <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {formError}
        </div>
      ) : null}

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
                    onChange={(e) => {
                      const nextName = e.target.value
                      setFormData({
                        ...formData,
                        name: nextName,
                        slug: slugTouched ? formData.slug : slugifyVietnamese(nextName),
                      })
                    }}
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
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      placeholder="vd: dior-jadore-intense"
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugTouched(true)
                        setFormData({ ...formData, slug: slugifyVietnamese(e.target.value) })
                      }}
                      required
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Chỉ dùng chữ thường, số và dấu gạch ngang.</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Input
                    id="category"
                    placeholder="VD: Nước hoa"
                    value={formData.category}
                    onChange={(e) =>
                      { setFormData({ ...formData, category: e.target.value }); }
                    }
                  />
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
              <h2 className="text-lg font-semibold mb-4">Ảnh sản phẩm</h2>
              <div className="space-y-4">
                {formData.image ? (
                  <div className="overflow-hidden rounded-md border border-border bg-muted">
                    <img src={formData.image} alt="Ảnh sản phẩm đã tải lên" className="h-56 w-full object-contain" />
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="product-image">Tải ảnh lên Cloudinary</Label>
                  <Input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      void handleImageUpload(event.target.files?.[0])
                    }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 5MB.</p>
                  {uploadingImage ? <p className="mt-2 text-sm text-muted-foreground">Đang tải ảnh...</p> : null}
                  {imageError ? <p className="mt-2 text-sm text-destructive">{imageError}</p> : null}
                </div>
                <div>
                  <Label htmlFor="image-url">URL ảnh</Label>
                  <Input
                    id="image-url"
                    placeholder="https://res.cloudinary.com/..."
                    value={formData.image}
                    onChange={(event) => {
                      setFormData({ ...formData, image: event.target.value })
                    }}
                  />
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
