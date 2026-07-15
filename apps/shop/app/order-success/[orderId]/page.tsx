'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Phone, MapPin, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VI_COPY } from '@/lib/constants'
import { formatVND } from '@/lib/utils'

interface OrderSuccessPageProps {
  params: Promise<{ orderId: string }>
}

export default function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    params.then((p) => setOrderId(p.orderId))
  }, [params])

  // Mock order data - in production, fetch from API
  const mockOrder = {
    code: orderId,
    recipientName: 'Nguyễn Văn A',
    recipientPhone: '0901234567',
    address: '123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh',
    items: [
      { name: 'Áo phông Premium Cotton', quantity: 2, price: 174000 },
      { name: 'Quần jeans classic', quantity: 1, price: 324000 },
    ],
    subtotal: 672000,
    discount: 75000,
    shipping: 30000,
    total: 627000,
    status: 'pending',
    createdAt: new Date().toLocaleString('vi-VN'),
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Success Icon & Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {VI_COPY.orderSuccess}
        </h1>
        <p className="text-muted-foreground">
          Cửa hàng sẽ liên hệ với bạn sớm để xác nhận đơn hàng
        </p>
      </div>

      {/* Order Code */}
      <div className="bg-primary/10 border-2 border-primary rounded-lg p-8 text-center mb-8">
        <p className="text-muted-foreground text-sm mb-2">Mã đơn hàng của bạn</p>
        <p className="text-3xl font-bold text-primary font-mono">{orderId}</p>
        <p className="text-sm text-muted-foreground mt-4">
          Vui lòng lưu mã này để theo dõi đơn hàng
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-muted rounded-lg p-6 space-y-6 mb-8">
        <h2 className="text-xl font-bold text-foreground">Chi tiết đơn hàng</h2>

        {/* Recipient Info */}
        <div className="border-b border-border pb-6 space-y-3">
          <h3 className="font-semibold text-foreground">Thông tin người nhận</h3>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">{mockOrder.recipientName}</p>
              <p className="text-sm text-muted-foreground">{mockOrder.recipientPhone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{mockOrder.address}</p>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-border pb-6 space-y-3">
          <h3 className="font-semibold text-foreground">Sản phẩm</h3>
          <div className="space-y-2">
            {mockOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-medium text-foreground">
                  {formatVND(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-3">
          <div className="flex justify-between text-foreground">
            <span>Tổng giá gốc</span>
            <span className="font-semibold">{formatVND(mockOrder.subtotal)}</span>
          </div>
          {mockOrder.discount > 0 && (
            <div className="flex justify-between text-secondary">
              <span>Ưu đãi khách hàng</span>
              <span className="font-semibold">-{formatVND(mockOrder.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-foreground">
            <span>Phí vận chuyển</span>
            <span className="font-semibold">{formatVND(mockOrder.shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-foreground font-bold text-lg">
            <span>Tổng thanh toán</span>
            <span className="text-primary">{formatVND(mockOrder.total)}</span>
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="bg-secondary/10 border border-secondary rounded-lg p-6 mb-8 space-y-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-secondary" />
          <p className="font-semibold text-foreground">Trạng thái đơn hàng</p>
        </div>
        <p className="text-secondary font-medium">Chờ xác nhận</p>
        <p className="text-sm text-muted-foreground">
          Đơn hàng của bạn đã được ghi nhận. Cửa hàng sẽ kiểm tra tồn kho và liên hệ với bạn trong vòng 24 giờ để xác nhận.
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-muted rounded-lg p-6 mb-8 space-y-4">
        <h3 className="font-bold text-foreground">Bước tiếp theo</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="font-bold text-primary">1</span>
            <span>
              Chúng tôi sẽ kiểm tra kho và xác nhận đơn hàng qua tin nhắn/cuộc gọi
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">2</span>
            <span>Đơn hàng sẽ được chuẩn bị và gửi đi trong 1-2 ngày làm việc</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">3</span>
            <span>Bạn sẽ nhận được thông báo khi đơn hàng được giao</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-primary">4</span>
            <span>
              Thanh toán khi nhận hàng (COD) - không phí thêm
            </span>
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link href="/shop" className="block">
          <Button className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90">
            Tiếp tục mua sắm
          </Button>
        </Link>

        <button className="w-full border border-border text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-muted transition-colors">
          📞 Liên hệ cửa hàng
        </button>
      </div>

      {/* Contact Info */}
      <div className="text-center mt-8 pt-8 border-t border-border space-y-2">
        <p className="text-sm text-muted-foreground">
          Có câu hỏi? Liên hệ với chúng tôi
        </p>
        <p className="font-semibold text-foreground">1900 XXXX</p>
        <p className="text-sm text-muted-foreground">support@vietshop.vn</p>
      </div>
    </div>
  )
}
