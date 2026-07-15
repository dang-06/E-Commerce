'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Zap, ShieldCheck, Smartphone, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePromotion } from '@/hooks/usePromotion'
import { checkPromotion } from '@/lib/services/promotionService'
import { isValidVietnamesePhone, formatPhoneNumber } from '@/lib/utils'
import { VI_COPY } from '@/lib/constants'

type PromotionState = 'input' | 'loading' | 'eligible' | 'ineligible' | 'error'

export default function PromotionGate() {
  const router = useRouter()
  const { setPromotion } = usePromotion()
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<PromotionState>('input')
  const [errorMessage, setErrorMessage] = useState('')

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidVietnamesePhone(phone)) {
      setErrorMessage(VI_COPY.invalidPhone)
      setState('error')
      return
    }

    setState('loading')
    setErrorMessage('')

    try {
      const result = await checkPromotion(phone)

      if (result.error === 'invalid_format') {
        setErrorMessage(VI_COPY.invalidPhone)
        setState('error')
        return
      }

      setPromotion(phone, result.isEligible)
      setState(result.isEligible ? 'eligible' : 'ineligible')
    } catch (error) {
      setErrorMessage(VI_COPY.errorChecking)
      setState('error')
    }
  }

  const handleReset = () => {
    setPhone('')
    setState('input')
    setErrorMessage('')
  }

  const goToShop = () => {
    router.push('/shop')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 border-4 border-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-lg font-bold text-primary">RP</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">ROSA</h1>
          <h2 className="text-2xl font-light text-primary mb-4 tracking-widest">PERFUME</h2>
          <p className="text-muted-foreground text-sm">Nước hoa cao cấp nhập khẩu</p>
        </div>

        {/* State: Input */}
        {state === 'input' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {VI_COPY.promotionTitle}
              </h2>
              <p className="text-muted-foreground">
                {VI_COPY.promotionSubtitle}
              </p>
            </div>

            <form onSubmit={handleCheck} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  {VI_COPY.enterPhone}
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '')
                    setPhone(cleaned)
                  }}
                  placeholder="0901234567"
                  maxLength="11"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={!phone || phone.length < 10}
                className="w-full"
              >
                {VI_COPY.checkButton}
              </Button>
            </form>

            {/* Benefits Section */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="text-center">
                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Kiểm tra nhanh</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">An toàn dữ liệu</p>
              </div>
              <div className="text-center">
                <Smartphone className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Không cần OTP</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-4">
              Thông tin của bạn sẽ chỉ được sử dụng để kiểm tra ưu đãi khách hàng
            </p>
          </div>
        )}

        {/* State: Loading */}
        {state === 'loading' && (
          <div className="space-y-6 text-center">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {VI_COPY.checkingLabel}
              </h2>
              <p className="text-muted-foreground text-sm">
                Đang kiểm tra số điện thoại...
              </p>
            </div>
          </div>
        )}

        {/* State: Eligible */}
        {state === 'eligible' && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-secondary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Chúc mừng!
              </h2>
              <p className="text-lg font-semibold text-secondary mb-2">
                {VI_COPY.eligible}
              </p>
              <p className="text-sm text-muted-foreground">
                Số điện thoại: {formatPhoneNumber(phone, true)}
              </p>
            </div>

            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
              <p className="text-sm text-foreground font-medium">
                ✓ Bạn được áp dụng ưu đãi cho tất cả sản phẩm
              </p>
            </div>

            <Button onClick={goToShop} className="w-full bg-secondary hover:bg-secondary/90">
              {VI_COPY.viewProducts}
            </Button>

            <button
              onClick={handleReset}
              className="w-full py-2 text-primary font-medium hover:underline"
            >
              {VI_COPY.checkAgain}
            </button>
          </div>
        )}

        {/* State: Ineligible */}
        {state === 'ineligible' && (
          <div className="space-y-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Thông báo
              </h2>
              <p className="text-base text-foreground mb-2">
                {VI_COPY.ineligible}
              </p>
              <p className="text-sm text-muted-foreground">
                Số điện thoại: {formatPhoneNumber(phone, true)}
              </p>
            </div>

            <div className="bg-muted border border-border rounded-lg p-4">
              <p className="text-sm text-foreground">
                Bạn vẫn có thể mua hàng với giá niêm yết cạnh tranh nhất trên thị trường.
              </p>
            </div>

            <Button onClick={goToShop} className="w-full">
              {VI_COPY.viewProducts}
            </Button>

            <button
              onClick={handleReset}
              className="w-full py-2 text-primary font-medium hover:underline"
            >
              {VI_COPY.checkAgain}
            </button>
          </div>
        )}

        {/* State: Error */}
        {state === 'error' && (
          <div className="space-y-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Lỗi
              </h2>
              <p className="text-base text-destructive mb-4">
                {errorMessage}
              </p>
            </div>

            <Button onClick={handleReset} className="w-full">
              Thử lại
            </Button>

            <Button variant="outline" onClick={goToShop} className="w-full">
              Tiếp tục mua sắm
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
