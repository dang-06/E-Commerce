'use client'

import Link from 'next/link'
import { ShoppingCart, Search, User } from 'lucide-react'
import { VI_COPY } from '@/lib/constants'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  cartItemCount?: number
}

export default function Header({ cartItemCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-border">
      {/* Main Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 border-2 border-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary">RP</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-primary tracking-widest">ROSA</div>
                <div className="text-xs font-semibold text-primary tracking-widest">PERFUME</div>
              </div>
            </Link>

            {/* Navigation - Hidden on Mobile */}
            <nav className="hidden lg:flex items-center gap-8 flex-1 ml-8">
              <Link href="/shop" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                CỬA HÀNG
              </Link>
              <a href="#sale" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                SALE
              </a>
              <a href="#brands" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                NHÂN HIỆU
              </a>
              <a href="#blog" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                BLOG
              </a>
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm sản phẩm của bạn"
                className="flex-1 px-4 py-2 bg-white border border-border text-sm focus:outline-none"
              />
              <button className="px-4 py-2 bg-black text-white hover:bg-secondary transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <User className="w-4 h-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">ĐĂNG NHẬP</span>
                  <span className="text-muted-foreground">/</span>
                </div>
                <span className="font-semibold text-foreground">ĐĂNG KÝ</span>
              </div>

              {/* Cart */}
              <Link href="/shop" className="relative">
                <ShoppingCart className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-accent text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>
              <div className="text-xs text-center">
                <div className="font-bold text-accent">0₫</div>
                <div className="text-muted-foreground">0 items</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
