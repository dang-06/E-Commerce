import Link from 'next/link'
import { VI_COPY } from '@/lib/constants'
import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 border-2 border-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">RP</span>
              </div>
              <div>
                <div className="text-xs font-bold text-primary tracking-widest">ROSA</div>
                <div className="text-xs font-bold text-primary tracking-widest">PERFUME</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nước hoa cao cấp nhập khẩu từ các thương hiệu nổi tiếng thế giới. Cam k承 100% chính hãng.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Sản phẩm</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Nước hoa nữ
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Nước hoa nam
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Khuyến mãi
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Thông tin</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Về Rosa Perfume
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Chính sách hoàn trả
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Liên hệ</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3 h-3 text-primary flex-shrink-0" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                <span>support@rosaperfume.vn</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                <span>Hà Nội, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>&copy; {currentYear} Rosa Perfume. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4 mt-4 md:mt-0 text-xs">
            <span>Giao hàng toàn quốc</span>
            <span>•</span>
            <span>Đổi trả trong 30 ngày</span>
            <span>•</span>
            <span>100% chính hãng</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
