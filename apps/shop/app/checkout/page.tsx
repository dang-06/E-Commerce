'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'
import { usePromotion } from '@/hooks/usePromotion'
import { getProducts } from '@/lib/services/productService'
import { createOrder } from '@/lib/services/orderService'
import { calculatePromotionDiscount, formatVND, formatPhoneNumber, isValidVietnamesePhone } from '@/lib/utils'
import { VI_COPY, PROMOTION_CONFIG, VIETNAMESE_PROVINCES, MOCK_DISTRICTS, MOCK_WARDS } from '@/lib/constants'
import type { CheckoutFormData } from '@/lib/types'

export default function CheckoutPage() {
  const router = useRouter()
  const { isEligible, promoPhone } = usePromotion()
  const { cartItems, subtotal, totalQuantity, clearCart } = useCart()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CheckoutFormData>({
    recipientName: '',
    recipientPhone: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    paymentMethod: 'cod',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-foreground font-semibold mb-4">{VI_COPY.cartEmpty}</p>
        <Link href="/shop" className="text-primary hover:underline">
          Tiếp tục mua sắm
        </Link>
      </div>
    )
  }

  const discount = isEligible ? calculatePromotionDiscount(totalQuantity) : 0
  const shippingFee = PROMOTION_CONFIG.shippingFee
  const total = subtotal - discount + shippingFee

  const districts = MOCK_DISTRICTS[formData.province] || []
  const wards = MOCK_WARDS[`${formData.province}_${formData.district}`] || []

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.recipientName.trim()) newErrors.recipientName = VI_COPY.nameRequired
    if (!formData.recipientPhone.trim()) newErrors.recipientPhone = VI_COPY.phoneRequired
    else if (!isValidVietnamesePhone(formData.recipientPhone))
      newErrors.recipientPhone = VI_COPY.invalidPhoneFormat

    if (!formData.province) newErrors.province = VI_COPY.provinceRequired
    if (!formData.district) newErrors.district = VI_COPY.districtRequired
    if (!formData.ward) newErrors.ward = VI_COPY.wardRequired
    if (!formData.address.trim()) newErrors.address = VI_COPY.addressRequired

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!promoPhone) {
      setErrors({ form: 'Vui lòng quay lại để kiểm tra ưu đãi' })
      return
    }

    setIsSubmitting(true)

    try {
      const order = await createOrder({
        phone: promoPhone,
        items: cartItems,
        formData,
        subtotal,
        discount,
        shippingFee,
        total,
      })

      clearCart()
      router.push(`/order-success/${order.code}`)
    } catch (error) {
      setErrors({ form: 'Lỗi khi đặt hàng. Vui lòng thử lại.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
      {/* Main Checkout Form */}
      <div className="lg:col-span-2">
        <Link href="/shop" className="flex items-center gap-2 text-primary hover:underline mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Quay lại giỏ hàng
        </Link>

        <form onSubmit={handleSubmit} className="space-y-8">
          {errors.form && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
              {errors.form}
            </div>
          )}

          {/* Recipient Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{VI_COPY.recipientInfo}</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {VI_COPY.recipientName}
              </label>
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              {errors.recipientName && (
                <p className="text-destructive text-sm mt-1">{errors.recipientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {VI_COPY.recipientPhone}
              </label>
              <input
                type="tel"
                name="recipientPhone"
                value={formData.recipientPhone}
                onChange={handleInputChange}
                placeholder="0901234567"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              {errors.recipientPhone && (
                <p className="text-destructive text-sm mt-1">{errors.recipientPhone}</p>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{VI_COPY.addressInfo}</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {VI_COPY.province}
                </label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-white"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {VIETNAMESE_PROVINCES.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="text-destructive text-sm mt-1">{errors.province}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {VI_COPY.district}
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  disabled={!formData.province}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-white disabled:opacity-50"
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="text-destructive text-sm mt-1">{errors.district}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {VI_COPY.ward}
                </label>
                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  disabled={!formData.district}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground bg-white disabled:opacity-50"
                >
                  <option value="">Chọn phường/xã</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.ward && (
                  <p className="text-destructive text-sm mt-1">{errors.ward}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {VI_COPY.streetAddress}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Đường ABC, Phường XYZ"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              {errors.address && (
                <p className="text-destructive text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {VI_COPY.notes}
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                placeholder="Ghi chú thêm (tuỳ chọn)"
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{VI_COPY.paymentMethod}</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-primary rounded-lg cursor-pointer bg-primary/5">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-semibold text-foreground">{VI_COPY.paymentCOD}</p>
                  <p className="text-sm text-muted-foreground">
                    Thanh toán khi nhận hàng, không phí thêm
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer opacity-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  disabled
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-semibold text-foreground">{VI_COPY.paymentBank}</p>
                  <p className="text-sm text-muted-foreground">Tính năng sắp có</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đặt hàng ngay'
            )}
          </Button>
        </form>
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-muted rounded-lg p-6 sticky top-24 space-y-4">
          <h3 className="font-bold text-foreground text-lg">Tóm tắt đơn hàng</h3>

          <div className="space-y-3 text-sm border-b border-border pb-4">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex justify-between text-muted-foreground">
                <span>Sản phẩm x{item.quantity}</span>
                <span className="font-medium text-foreground">{formatVND(0)}</span>
              </div>
            ))}
          </div>

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

            <div className="flex justify-between border-t border-border pt-2 text-foreground font-bold text-lg">
              <span>{VI_COPY.totalPayment}</span>
              <span className="text-primary">{formatVND(total)}</span>
            </div>
          </div>

          {promoPhone && (
            <div className="bg-secondary/10 border border-secondary rounded p-3 text-sm">
              <p className="text-secondary font-semibold">Ưu đãi khách hàng</p>
              <p className="text-muted-foreground">{formatPhoneNumber(promoPhone, true)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
