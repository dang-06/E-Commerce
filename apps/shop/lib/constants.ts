import type { Product, VietnamLocation, District, Ward } from './types'

/**
 * Vietnamese UI Copy & Constants
 */

export const VI_COPY = {
  // Navigation
  appName: 'Rosa Perfume',
  shop: 'Cửa hàng',
  cart: 'Giỏ hàng',
  home: 'Trang chủ',
  contact: 'Liên hệ',
  
  // Promotion Gate
  promotionTitle: 'Kiểm tra ưu đãi khách hàng',
  promotionSubtitle: 'Nhập số điện thoại của bạn để nhận giảm giá đặc biệt',
  enterPhone: 'Nhập số điện thoại',
  checkButton: 'Kiểm tra ưu đãi',
  checkingLabel: 'Đang kiểm tra...',
  
  // Promotion Results
  eligible: 'Chúc mừng! Bạn được giảm 25.000đ cho mỗi sản phẩm.',
  ineligible: 'Số điện thoại chưa đủ điều kiện. Bạn vẫn có thể mua với giá niêm yết.',
  invalidPhone: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam 10 chữ số.',
  errorChecking: 'Lỗi khi kiểm tra. Vui lòng thử lại.',
  checkAgain: 'Kiểm tra lại',
  viewProducts: 'Xem sản phẩm ưu đãi',
  
  // Product Listing
  products: 'Sản phẩm',
  loading: 'Đang tải...',
  noProducts: 'Không có sản phẩm',
  inStock: 'Còn hàng',
  outOfStock: 'Hết hàng',
  discount: 'Tiết kiệm',
  listedPrice: 'Giá gốc',
  price: 'Giá',
  
  // Product Actions
  addToCart: 'Thêm vào giỏ',
  addedToCart: 'Đã thêm vào giỏ hàng',
  quantity: 'Số lượng',
  increase: 'Tăng',
  decrease: 'Giảm',
  remove: 'Xóa',
  
  // Cart
  cartEmpty: 'Giỏ hàng trống',
  cartEmptyMessage: 'Hãy thêm sản phẩm để bắt đầu mua sắm',
  continueShopping: 'Tiếp tục mua hàng',
  checkout: 'Tiến hành đặt hàng',
  
  // Pricing
  subtotal: 'Tổng giá gốc',
  customerDiscount: 'Ưu đãi khách hàng',
  afterDiscount: 'Tổng sau giảm',
  shippingFee: 'Phí vận chuyển',
  totalPayment: 'Tổng thanh toán',
  
  // Checkout
  recipientInfo: 'Thông tin người nhận',
  recipientName: 'Họ và tên người nhận',
  recipientPhone: 'Số điện thoại người nhận',
  addressInfo: 'Địa chỉ giao hàng',
  province: 'Tỉnh/Thành phố',
  district: 'Quận/Huyện',
  ward: 'Phường/Xã',
  streetAddress: 'Địa chỉ chi tiết',
  notes: 'Ghi chú (tuỳ chọn)',
  paymentMethod: 'Phương thức thanh toán',
  paymentCOD: 'Thanh toán khi nhận hàng (COD)',
  paymentBank: 'Chuyển khoản ngân hàng',
  
  // Checkout Validation
  nameRequired: 'Vui lòng nhập họ tên',
  phoneRequired: 'Vui lòng nhập số điện thoại',
  invalidPhoneFormat: 'Số điện thoại không hợp lệ',
  provinceRequired: 'Vui lòng chọn tỉnh/thành phố',
  districtRequired: 'Vui lòng chọn quận/huyện',
  wardRequired: 'Vui lòng chọn phường/xã',
  addressRequired: 'Vui lòng nhập địa chỉ chi tiết',
  
  // Order Success
  orderSuccess: 'Đặt hàng thành công!',
  orderCode: 'Mã đơn hàng',
  orderDetails: 'Chi tiết đơn hàng',
  orderStatus: 'Trạng thái đơn hàng',
  statusPending: 'Chờ xác nhận',
  nextSteps: 'Bước tiếp theo',
  nextStepsMessage: 'Cửa hàng sẽ liên hệ với bạn sớm để xác nhận đơn hàng. Vui lòng kiểm tra tin nhắn.',
  backToShop: 'Tiếp tục mua hàng',
  contactShop: 'Liên hệ cửa hàng',
}

/**
 * Promotion Configuration
 */
export const PROMOTION_CONFIG = {
  discountPerUnit: 25000, // 25,000 VND
  shippingFee: 30000, // 30,000 VND
  
  // Mock: Phone numbers ending in 0, 1, 2 are eligible
  isEligible: (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    const lastDigit = parseInt(cleaned[cleaned.length - 1])
    return [0, 1, 2].includes(lastDigit)
  },
}

/**
 * Mock Product Data
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'PERF001',
    name: 'Dior J\'adore Intense Parfum',
    slug: 'dior-jadore-intense-parfum',
    description: 'Nước hoa cao cấp Dior J\'adore Intense Parfum với hương thơm ngây ngất và lâu lại',
    image: '/products/perfume-1.png',
    listedPrice: 5980000,
    discount: 11,
    category: 'Nước hoa nữ',
    inStock: true,
  },
  {
    id: '2',
    sku: 'PERF002',
    name: 'Dior J\'adore Eau de Parfum Gift Set',
    slug: 'dior-jadore-eau-de-parfum-gift-set',
    description: 'Bộ quà tặng Dior J\'adore bao gồm nước hoa 50ml và body lotion',
    image: '/products/perfume-2.png',
    listedPrice: 6500000,
    discount: 20,
    category: 'Nước hoa nữ',
    inStock: true,
  },
  {
    id: '3',
    sku: 'PERF003',
    name: 'Miss Dior Essence',
    slug: 'miss-dior-essence',
    description: 'Miss Dior Essence - Nước hoa quyến rũ với hương thơm nhẹ nhàng, nữ tính',
    image: '/products/perfume-3.png',
    listedPrice: 5800000,
    discount: 9,
    category: 'Nước hoa nữ',
    inStock: true,
  },
  {
    id: '4',
    sku: 'PERF004',
    name: 'Dior Pure Poison',
    slug: 'dior-pure-poison',
    description: 'Dior Pure Poison - Nước hoa quyến rũ với mùi hương gợi cảm',
    image: '/products/perfume-4.png',
    listedPrice: 4500000,
    discount: 0,
    category: 'Nước hoa nữ',
    inStock: true,
  },
  {
    id: '5',
    sku: 'PERF005',
    name: 'Dior Poison Girl',
    slug: 'dior-poison-girl',
    description: 'Dior Poison Girl - Nước hoa trẻ trung, ngọt ngào, phù hợp cho các nàng trẻ',
    image: '/products/perfume-5.png',
    listedPrice: 3900000,
    discount: 18,
    category: 'Nước hoa nữ',
    inStock: true,
  },
  {
    id: '6',
    sku: 'PERF006',
    name: 'Dior Hypnotic Poison',
    slug: 'dior-hypnotic-poison',
    description: 'Dior Hypnotic Poison - Nước hoa huyền bí với hương thơm rất độc đáo',
    image: '/products/perfume-6.png',
    listedPrice: 4200000,
    discount: 19,
    category: 'Nước hoa nữ',
    inStock: true,
  },
  {
    id: '7',
    sku: 'PERF007',
    name: 'Dior J\'adore L\'or',
    slug: 'dior-jadore-lor',
    description: 'Dior J\'adore L\'or - Phiên bản Limited Edition với nắp vàng sang trọng',
    image: '/products/perfume-7.png',
    listedPrice: 6800000,
    discount: 0,
    category: 'Nước hoa nữ',
    inStock: true,
  },
  {
    id: '8',
    sku: 'PERF008',
    name: 'Dior Adore',
    slug: 'dior-adore',
    description: 'Dior Adore - Nước hoa lôi cuốn với hương thơm tinh tế và đầy cá tính',
    image: '/products/perfume-8.png',
    listedPrice: 5200000,
    discount: 8,
    category: 'Nước hoa nữ',
    inStock: true,
  },
  {
    id: '9',
    sku: 'PERF009',
    name: 'Dior Sauvage',
    slug: 'dior-sauvage',
    description: 'Dior Sauvage - Nước hoa nam lôi cuốn với hương ambroxan ấm áp',
    image: '/products/perfume-9.png',
    listedPrice: 4800000,
    discount: 0,
    category: 'Nước hoa nam',
    inStock: true,
  },
]

/**
 * Mock Vietnamese Provinces (Simplified)
 */
export const VIETNAMESE_PROVINCES: VietnamLocation[] = [
  { code: 'HN', name: 'Hà Nội' },
  { code: 'TPHCM', name: 'TP. Hồ Chí Minh' },
  { code: 'DN', name: 'Đà Nẵng' },
  { code: 'HG', name: 'Hải Phòng' },
  { code: 'CT', name: 'Cần Thơ' },
  { code: 'BP', name: 'Bắc Ninh' },
  { code: 'HD', name: 'Hải Dương' },
  { code: 'QN', name: 'Quảng Ninh' },
  { code: 'NB', name: 'Ninh Bình' },
  { code: 'HT', name: 'Hà Tĩnh' },
]

/**
 * Mock Districts (Key only)
 * In a real app, this would be a complete mapping
 */
export const MOCK_DISTRICTS: Record<string, District[]> = {
  HN: [
    { code: 'HBT', name: 'Hoàn Bà Trưng', provinceCode: 'HN' },
    { code: 'BTL', name: 'Ba Đình', provinceCode: 'HN' },
    { code: 'DKT', name: 'Đống Đa', provinceCode: 'HN' },
  ],
  TPHCM: [
    { code: 'Q1', name: 'Quận 1', provinceCode: 'TPHCM' },
    { code: 'Q2', name: 'Quận 2', provinceCode: 'TPHCM' },
    { code: 'Q3', name: 'Quận 3', provinceCode: 'TPHCM' },
  ],
  DN: [
    { code: 'HCH', name: 'Hải Châu', provinceCode: 'DN' },
    { code: 'TNH', name: 'Thanh Khê', provinceCode: 'DN' },
  ],
}

/**
 * Mock Wards (Key only)
 */
export const MOCK_WARDS: Record<string, Ward[]> = {
  'HN_HBT': [
    { code: 'PY', name: 'Phường Yên Ph���', districtCode: 'HBT' },
    { code: 'PTH', name: 'Phường Tây Hồ', districtCode: 'HBT' },
  ],
  'TPHCM_Q1': [
    { code: 'BT', name: 'Phường Bến Thành', districtCode: 'Q1' },
    { code: 'NT', name: 'Phường Nguyễn Thái Bình', districtCode: 'Q1' },
  ],
}
