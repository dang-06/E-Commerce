'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Save, Key } from 'lucide-react'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSaving(false)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Tổng quan', href: '/admin' }, { label: 'Cấu hình' }]} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cấu hình hệ thống</h1>
        <p className="mt-1 text-muted-foreground">Quản lý các cài đặt của cửa hàng</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Promotion Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Cấu hình ưu đãi</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="promo-name">Tên chương trình</Label>
                <Input id="promo-name" defaultValue="Khách hàng ưu đãi" />
              </div>
              <div>
                <Label htmlFor="discount-amount">Số tiền giảm giá (VND)</Label>
                <Input id="discount-amount" type="number" defaultValue="25000" />
              </div>
              <div>
                <Label htmlFor="usage-limit">Giới hạn lần dùng</Label>
                <Input id="usage-limit" type="number" defaultValue="12" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="promo-active" defaultChecked />
                <Label htmlFor="promo-active">Kích hoạt chương trình</Label>
              </div>
            </div>
          </Card>

          {/* Shipping Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Cấu hình vận chuyển</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="shipping-fee">Phí vận chuyển (VND)</Label>
                <Input id="shipping-fee" type="number" defaultValue="30000" />
              </div>
              <div>
                <Label htmlFor="free-shipping">Miễn phí vận chuyển từ (VND)</Label>
                <Input id="free-shipping" type="number" defaultValue="0" />
              </div>
            </div>
          </Card>

          {/* Order Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Cấu hình đơn hàng</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="order-prefix">Tiền tố mã đơn</Label>
                <Input id="order-prefix" defaultValue="ORD" />
              </div>
              <div>
                <Label htmlFor="payment-methods">Phương thức thanh toán</Label>
                <div className="space-y-2 mt-2">
                  {['COD', 'Chuyển khoản', 'Thẻ tín dụng'].map((method) => (
                    <div key={method} className="flex items-center gap-2">
                      <Checkbox id={`method-${method}`} defaultChecked />
                      <Label htmlFor={`method-${method}`}>{method}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <Button
            onClick={() => {
              void handleSave()
            }}
            disabled={saving}
            size="lg"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </Button>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Integration Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="h-5 w-5" />
              Tích hợp
            </h2>
            <div className="space-y-4">
              <div className="pb-4 border-b border-border">
                <p className="font-semibold text-sm mb-2">Google Sheet</p>
                <p className="text-xs text-muted-foreground mb-2">Chưa kết nối</p>
                <Button size="sm" variant="outline" className="w-full">
                  Kết nối
                </Button>
              </div>
              <div className="pb-4 border-b border-border">
                <p className="font-semibold text-sm mb-2">Pancake</p>
                <p className="text-xs text-green-600 mb-2">✓ Đã kết nối</p>
                <Button size="sm" variant="outline" className="w-full">
                  Cấu hình lại
                </Button>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">BEST Express</p>
                <p className="text-xs text-green-600 mb-2">✓ Đã kết nối</p>
                <Button size="sm" variant="outline" className="w-full">
                  Cấu hình lại
                </Button>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive/50 bg-destructive/5">
            <h2 className="text-lg font-semibold mb-4 text-destructive">Vùng nguy hiểm</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Những hành động trong phần này không thể hoàn tác
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                window.confirm('Hành động này đang bị khóa trong MVP để tránh xóa nhầm dữ liệu.')
              }}
            >
              Xoá tất cả dữ liệu
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
