'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { MoneyDisplay } from '@/components/shared/MoneyDisplay'
import { PhoneMask } from '@/components/shared/PhoneMask'
import { ArrowLeft, Copy, Printer } from 'lucide-react'
import { Order } from '@/lib/types'
import { orderService } from '@/lib/services/api-service'
import { formatVietnameseDateTimeWithDay } from '@/lib/utils/vietnamese'

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await orderService.getOrderById(orderId)
        setOrder(data)
        setNotes(data?.notes ?? '')
      } catch (e) {
        console.error('Failed to load order:', e)
      } finally {
        setLoading(false)
      }
    }

    void loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6 p-6">
        <p className="text-destructive">Không tìm thấy đơn hàng</p>
        <Link href="/admin/orders">
          <Button>Quay lại</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Tổng quan', href: '/admin' },
          { label: 'Đơn hàng', href: '/admin/orders' },
          { label: order.code },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{order.code}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo: {formatVietnameseDateTimeWithDay(order.createdAt)}
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          In đơn
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Trạng thái đơn hàng</h2>
            <div className="grid gap-4 grid-cols-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Trạng thái</p>
                <StatusBadge type="order" status={order.status} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Thanh toán</p>
                <StatusBadge type="payment" status={order.paymentStatus} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Đồng bộ</p>
                <StatusBadge type="sync" status={order.syncStatus} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">Cập nhật trạng thái</span>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-3"
                  value={order.status}
                  onChange={(event) => {
                    setOrder({ ...order, status: event.target.value as Order['status'] })
                  }}
                >
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="preparing">preparing</option>
                  <option value="shipping">shipping</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                  <option value="returned">returned</option>
                </select>
              </label>
              <Button
                className="self-end"
                onClick={() => {
                  if (window.confirm('Cập nhật trạng thái đơn hàng?')) {
                    void orderService.updateOrder(order.id, { status: order.status }).then(() => {
                      setSuccess('Đã cập nhật trạng thái đơn.')
                    })
                  }
                }}
              >
                Lưu trạng thái
              </Button>
            </div>
            {success ? <p className="mt-3 text-sm text-green-700">{success}</p> : null}
          </Card>

          {/* Recipient Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin nhận hàng</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Tên khách</p>
                <p className="font-semibold">{order.recipientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Điện thoại</p>
                <p className="font-semibold">
                  <PhoneMask phone={order.phone} showFull title={false} />
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Địa chỉ giao hàng</p>
                <p className="font-semibold">{order.address}</p>
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sản phẩm</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center pb-3 border-b border-border">
                  <div className="flex-1">
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">x{item.quantity}</p>
                    <MoneyDisplay amount={item.price * item.quantity} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Ghi chú nội bộ</h2>
            <Textarea
              placeholder="Thêm ghi chú..."
              value={notes}
              onChange={(e) => { setNotes(e.target.value); }}
              rows={3}
            />
            <Button className="mt-3">Lưu ghi chú</Button>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tóm tắt</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  <MoneyDisplay amount={order.subtotal} />
                </span>
              </div>
              {order.discountApplied && (
                <div className="flex justify-between text-green-600">
                  <span className="text-muted-foreground">Giảm giá ưu đãi</span>
                  <span>-{order.discount.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vận chuyển</span>
                <span>
                  <MoneyDisplay amount={order.shipping} />
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary">
                  <MoneyDisplay amount={order.total} />
                </span>
              </div>
            </div>
          </Card>

          {/* Sync Info */}
          {order.pancakeOrderId && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Đồng bộ</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Pancake</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-xs">{order.pancakeOrderId}</code>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
