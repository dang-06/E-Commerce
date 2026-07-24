import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHmac } from "node:crypto";

const prisma = new PrismaClient();

const defaultPassword = process.env.DEV_ADMIN_PASSWORD ?? "Admin@123456";
const hashSecret =
  process.env.API_AUTH_SECRET ?? "development-only-change-me-auth-secret-at-least-32-characters";

interface AttributeSeed {
  label: string;
  value: string;
}

interface ProductImageSeed {
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

interface ProductVariantSeed {
  name: string;
  colorCode: string;
  imageUrl: string;
  sku: string;
  sortOrder: number;
}

interface ProductSeed {
  sku: string;
  slug: string;
  name: string;
  description: string;
  listedPrice: bigint;
  imageUrl: string;
  stockQuantity: number;
  sortOrder: number;
  productAttributes: AttributeSeed[];
  detailImageUrls: string[];
  sellerName: string;
  sellerYears: number;
  sellerPrimaryCategory: string;
  minimumOrderQuantity: number;
  shippingOrigin: string;
  shippingLeadTime: string;
  returnPolicy: string;
  reviewRating: string;
  reviewCount: number;
  reviewTags: AttributeSeed[];
  reviewImageUrls: string[];
  qualityCertifications: AttributeSeed[];
  packagingAttributes: AttributeSeed[];
  images: ProductImageSeed[];
  colorVariants: ProductVariantSeed[];
}

function hashSensitiveValue(value: string): string {
  return createHmac("sha256", hashSecret).update(value).digest("hex");
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@example.local" },
    update: {
      fullName: "Development Admin",
      passwordHash,
      role: "admin",
      status: "active",
    },
    create: {
      email: "admin@example.local",
      fullName: "Development Admin",
      passwordHash,
      role: "admin",
      status: "active",
    },
  });

  await prisma.admin.upsert({
    where: { email: "operator@example.local" },
    update: {
      fullName: "Development Operator",
      passwordHash,
      role: "operator",
      status: "active",
    },
    create: {
      email: "operator@example.local",
      fullName: "Development Operator",
      passwordHash,
      role: "operator",
      status: "active",
    },
  });

  await prisma.promotionRule.upsert({
    where: { code: "PHONE_25000" },
    update: {
      name: "Phone-based 25.000 VND discount",
      discountAmount: 25000n,
      isActive: true,
    },
    create: {
      code: "PHONE_25000",
      name: "Phone-based 25.000 VND discount",
      discountAmount: 25000n,
      isActive: true,
      config: {
        note: "Development seed only. Business limits still require confirmation.",
      },
    },
  });

  await prisma.googleSheetConfig.upsert({
    where: { purpose: "eligible_customers" },
    update: {
      sheetUrl:
        "https://docs.google.com/spreadsheets/d/11dJMJ2rQLjcBlw4fjJJVVEvU07t00ujPF2oVyAz1fQk/edit?usp=sharing",
      spreadsheetId: "11dJMJ2rQLjcBlw4fjJJVVEvU07t00ujPF2oVyAz1fQk",
      worksheetName: null,
      phoneColumn: "A",
      isActive: true,
    },
    create: {
      purpose: "eligible_customers",
      sheetUrl:
        "https://docs.google.com/spreadsheets/d/11dJMJ2rQLjcBlw4fjJJVVEvU07t00ujPF2oVyAz1fQk/edit?usp=sharing",
      spreadsheetId: "11dJMJ2rQLjcBlw4fjJJVVEvU07t00ujPF2oVyAz1fQk",
      worksheetName: null,
      phoneColumn: "A",
      isActive: true,
    },
  });

  await prisma.googleSheetConfig.upsert({
    where: { purpose: "orders" },
    update: {
      sheetUrl:
        "https://docs.google.com/spreadsheets/d/1H0Em48MvTPgucBTP4DEu8k4RIua_uID-nisetyYLaIs/edit?usp=sharing",
      spreadsheetId: "1H0Em48MvTPgucBTP4DEu8k4RIua_uID-nisetyYLaIs",
      worksheetName: null,
      orderMapping: {
        columns: [
          "syncedAt",
          "orderCode",
          "recipientName",
          "recipientPhone",
          "address",
          "totalQuantity",
          "subtotal",
          "discountAmount",
          "shippingFee",
          "totalAmount",
          "paymentMethod",
          "note",
          "items",
        ],
      },
      isActive: true,
    },
    create: {
      purpose: "orders",
      sheetUrl:
        "https://docs.google.com/spreadsheets/d/1H0Em48MvTPgucBTP4DEu8k4RIua_uID-nisetyYLaIs/edit?usp=sharing",
      spreadsheetId: "1H0Em48MvTPgucBTP4DEu8k4RIua_uID-nisetyYLaIs",
      worksheetName: null,
      orderMapping: {
        columns: [
          "syncedAt",
          "orderCode",
          "recipientName",
          "recipientPhone",
          "address",
          "totalQuantity",
          "subtotal",
          "discountAmount",
          "shippingFee",
          "totalAmount",
          "paymentMethod",
          "note",
          "items",
        ],
      },
      isActive: true,
    },
  });

  await prisma.siteSettings.upsert({
    where: { key: "default" },
    update: {
      bannerButtonText: "Mua ngay",
      bannerEyebrow: "Hàng chọn lọc từ xưởng uy tín",
      bannerImageUrl: "/products/perfume-8.png",
      bannerSubtitle:
        "Tuyển chọn sản phẩm có ảnh chi tiết, thông số rõ ràng, chính sách đổi trả và dữ liệu tồn kho minh bạch.",
      bannerTitle: "Bộ sưu tập chăm sóc cá nhân",
      catalogTitle: "Trending now",
      logoImageUrl: "/placeholder-logo.png",
      logoText: "NIK Studio",
    },
    create: {
      bannerButtonText: "Mua ngay",
      bannerEyebrow: "Hàng chọn lọc từ xưởng uy tín",
      bannerImageUrl: "/products/perfume-8.png",
      bannerSubtitle:
        "Tuyển chọn sản phẩm có ảnh chi tiết, thông số rõ ràng, chính sách đổi trả và dữ liệu tồn kho minh bạch.",
      bannerTitle: "Bộ sưu tập chăm sóc cá nhân",
      catalogTitle: "Trending now",
      key: "default",
      logoImageUrl: "/placeholder-logo.png",
      logoText: "NIK Studio",
    },
  });

  const sharedReviewTags = [
    { label: "Dịch vụ chăm sóc khách hàng", value: "10+" },
    { label: "Giá rất tốt", value: "10+" },
    { label: "Chất lượng khá tốt", value: "8" },
    { label: "Vận chuyển nhanh", value: "6" },
  ];
  const sharedCertifications = [
    {
      label: "Cảnh báo",
      value: "Sản phẩm chăm sóc cá nhân không thay thế thuốc và không dùng để điều trị bệnh.",
    },
    {
      label: "Hồ sơ chất lượng",
      value: "Nhà bán cung cấp thông tin lô hàng, xuất xứ và thông số sản phẩm theo từng SKU.",
    },
  ];

  const products: ProductSeed[] = [
    {
      sku: "NIK-HAIR-WAND-001",
      slug: "gay-nhuom-toc-phu-bac-tuc-thi",
      name: "Gậy nhuộm tóc phủ bạc tức thì",
      description:
        "Que phủ bạc dạng thỏi dùng nhanh cho chân tóc, tóc mai và vùng tóc cần che phủ tạm thời. Kết cấu gọn nhẹ, dễ mang theo, phù hợp dùng trước khi đi làm, gặp khách hoặc chụp hình.",
      listedPrice: 59000n,
      imageUrl: "/products/perfume-1.png",
      stockQuantity: 71319,
      sortOrder: 1,
      productAttributes: [
        { label: "Loại thương hiệu", value: "Sản phẩm nội địa chất lượng cao" },
        { label: "Thương hiệu", value: "Han zini" },
        { label: "Nguồn gốc", value: "Quảng Đông" },
        { label: "Người mẫu", value: "Que cài tóc 1" },
        { label: "Hạn sử dụng", value: "3 năm" },
        { label: "Tác dụng", value: "Che phủ tóc bạc, dưỡng ẩm" },
      ],
      detailImageUrls: [
        "/products/perfume-1.png",
        "/products/perfume-2.png",
        "/products/perfume-3.png",
      ],
      sellerName: "Công ty TNHH Công nghệ Sinh Mỹ Quảng Đông",
      sellerYears: 3,
      sellerPrimaryCategory: "Sản phẩm chăm sóc tóc",
      minimumOrderQuantity: 3,
      shippingOrigin: "Sán Đầu, Quảng Đông",
      shippingLeadTime: "Giao hàng trong vòng 48 giờ",
      returnPolicy: "Miễn phí vận chuyển trả hàng",
      reviewRating: "4.40",
      reviewCount: 70,
      reviewTags: sharedReviewTags,
      reviewImageUrls: ["/products/perfume-4.png", "/products/perfume-5.png"],
      qualityCertifications: [
        ...sharedCertifications,
        { label: "Số đăng ký", value: "Quảng Đông G, 2025056915" },
      ],
      packagingAttributes: [
        { label: "Phân loại màu sắc", value: "Đen tự nhiên, đen nâu, nâu" },
        { label: "Khối lượng", value: "70g" },
        { label: "Quy cách", value: "1 thỏi/hộp" },
        { label: "Kích thước hộp", value: "10 x 4 x 4 cm" },
      ],
      images: [
        { imageUrl: "/products/perfume-1.png", altText: "Gậy nhuộm tóc hộp đen", sortOrder: 1 },
        {
          imageUrl: "/products/perfume-2.png",
          altText: "Gậy nhuộm tóc ảnh chi tiết",
          sortOrder: 2,
        },
        { imageUrl: "/products/perfume-3.png", altText: "Gậy nhuộm tóc phối cảnh", sortOrder: 3 },
      ],
      colorVariants: [
        {
          name: "Trầm cài tóc màu đen tự nhiên",
          colorCode: "#111111",
          imageUrl: "/products/perfume-1.png",
          sku: "NIK-HAIR-WAND-001-BLK",
          sortOrder: 1,
        },
        {
          name: "Trầm cài tóc màu đen nâu",
          colorCode: "#2b1f1a",
          imageUrl: "/products/perfume-2.png",
          sku: "NIK-HAIR-WAND-001-DBR",
          sortOrder: 2,
        },
        {
          name: "Trầm cài tóc màu nâu",
          colorCode: "#65412d",
          imageUrl: "/products/perfume-3.png",
          sku: "NIK-HAIR-WAND-001-BRN",
          sortOrder: 3,
        },
      ],
    },
    {
      sku: "NIK-LIP-BALM-002",
      slug: "son-duong-moi-hanzini-hop-qua",
      name: "Son dưỡng môi Hanzini hộp quà",
      description:
        "Bộ son dưỡng môi nhiều hương, chất son mềm, hỗ trợ làm dịu môi khô và giữ bề mặt môi căng mịn khi dùng hằng ngày.",
      listedPrice: 39000n,
      imageUrl: "/products/perfume-6.png",
      stockQuantity: 460000,
      sortOrder: 2,
      productAttributes: [
        { label: "Công dụng", value: "Dưỡng ẩm môi" },
        { label: "Kết cấu", value: "Sáp mềm" },
        { label: "Mùi hương", value: "Trái cây tổng hợp" },
        { label: "Phù hợp", value: "Môi khô, dùng hằng ngày" },
      ],
      detailImageUrls: ["/products/perfume-6.png", "/products/perfume-7.png"],
      sellerName: "Nhà máy mỹ phẩm Hanzini",
      sellerYears: 5,
      sellerPrimaryCategory: "Chăm sóc môi",
      minimumOrderQuantity: 6,
      shippingOrigin: "Nghĩa Ô, Chiết Giang",
      shippingLeadTime: "Xuất kho trong 24-48 giờ",
      returnPolicy: "Hỗ trợ đổi trả khi lỗi đóng gói",
      reviewRating: "4.60",
      reviewCount: 128,
      reviewTags: [
        { label: "Mùi thơm dễ chịu", value: "20+" },
        { label: "Bao bì đẹp", value: "12+" },
        { label: "Giữ ẩm tốt", value: "9" },
      ],
      reviewImageUrls: ["/products/perfume-6.png"],
      qualityCertifications: sharedCertifications,
      packagingAttributes: [
        { label: "Quy cách", value: "1 hộp 4 thỏi" },
        { label: "Khối lượng", value: "95g" },
        { label: "Hạn dùng", value: "36 tháng" },
      ],
      images: [
        { imageUrl: "/products/perfume-6.png", altText: "Son dưỡng môi hộp quà", sortOrder: 1 },
        { imageUrl: "/products/perfume-7.png", altText: "Son dưỡng môi nhiều hương", sortOrder: 2 },
      ],
      colorVariants: [
        {
          name: "Set đào hồng",
          colorCode: "#ff9aa8",
          imageUrl: "/products/perfume-6.png",
          sku: "NIK-LIP-BALM-002-PNK",
          sortOrder: 1,
        },
        {
          name: "Set trái cây",
          colorCode: "#f3c85a",
          imageUrl: "/products/perfume-7.png",
          sku: "NIK-LIP-BALM-002-FRT",
          sortOrder: 2,
        },
      ],
    },
    {
      sku: "NIK-SHAMPOO-OIL-003",
      slug: "bo-dau-goi-dau-xa-duong-toc",
      name: "Bộ dầu gội và dầu xả dưỡng tóc",
      description:
        "Bộ chăm sóc tóc dung tích lớn, tập trung vào cảm giác sạch da đầu, tóc mềm và dễ chải sau khi gội.",
      listedPrice: 129000n,
      imageUrl: "/products/perfume-8.png",
      stockQuantity: 60000,
      sortOrder: 3,
      productAttributes: [
        { label: "Loại tóc", value: "Tóc khô, tóc dễ rối" },
        { label: "Dung tích", value: "500ml + 500ml" },
        { label: "Hiệu quả", value: "Làm sạch, dưỡng mềm" },
        { label: "Hương", value: "Hoa trà nhẹ" },
      ],
      detailImageUrls: ["/products/perfume-8.png", "/products/perfume-9.png"],
      sellerName: "Xưởng chăm sóc tóc Flora Lab",
      sellerYears: 4,
      sellerPrimaryCategory: "Dầu gội và dầu xả",
      minimumOrderQuantity: 2,
      shippingOrigin: "Quảng Châu, Quảng Đông",
      shippingLeadTime: "Giao hàng trong 48 giờ",
      returnPolicy: "Đổi trả nếu rò rỉ trong vận chuyển",
      reviewRating: "4.50",
      reviewCount: 96,
      reviewTags: [
        { label: "Tóc mềm hơn", value: "18" },
        { label: "Mùi dễ chịu", value: "15" },
        { label: "Đóng gói chắc", value: "11" },
      ],
      reviewImageUrls: ["/products/perfume-8.png"],
      qualityCertifications: sharedCertifications,
      packagingAttributes: [
        { label: "Quy cách", value: "2 chai/bộ" },
        { label: "Khối lượng", value: "1.2kg" },
        { label: "Đóng gói", value: "Túi chống sốc + thùng carton" },
      ],
      images: [
        { imageUrl: "/products/perfume-8.png", altText: "Bộ dầu gội dầu xả", sortOrder: 1 },
        { imageUrl: "/products/perfume-9.png", altText: "Chi tiết bộ chăm sóc tóc", sortOrder: 2 },
      ],
      colorVariants: [
        {
          name: "Bộ phục hồi",
          colorCode: "#b68a45",
          imageUrl: "/products/perfume-8.png",
          sku: "NIK-SHAMPOO-OIL-003-RPR",
          sortOrder: 1,
        },
        {
          name: "Bộ dưỡng ẩm",
          colorCode: "#efe0bd",
          imageUrl: "/products/perfume-9.png",
          sku: "NIK-SHAMPOO-OIL-003-MST",
          sortOrder: 2,
        },
      ],
    },
    {
      sku: "NIK-HAND-CREAM-004",
      slug: "kem-duong-da-tay-am-sau",
      name: "Kem dưỡng da tay ẩm sâu",
      description:
        "Kem dưỡng tay dùng ban ngày, thấm nhanh, giảm cảm giác khô căng sau khi rửa tay hoặc làm việc trong phòng lạnh.",
      listedPrice: 45000n,
      imageUrl: "/products/perfume-4.png",
      stockQuantity: 440000,
      sortOrder: 4,
      productAttributes: [
        { label: "Dung tích", value: "60g" },
        { label: "Kết cấu", value: "Kem mịn thấm nhanh" },
        { label: "Phù hợp", value: "Da tay khô" },
        { label: "Hạn dùng", value: "36 tháng" },
      ],
      detailImageUrls: ["/products/perfume-4.png", "/products/perfume-5.png"],
      sellerName: "Công ty mỹ phẩm Daily Care",
      sellerYears: 6,
      sellerPrimaryCategory: "Chăm sóc da tay",
      minimumOrderQuantity: 5,
      shippingOrigin: "Thâm Quyến, Quảng Đông",
      shippingLeadTime: "Xuất kho nhanh trong ngày làm việc",
      returnPolicy: "Hỗ trợ đổi trả trong 7 ngày",
      reviewRating: "4.70",
      reviewCount: 214,
      reviewTags: [
        { label: "Thấm nhanh", value: "30+" },
        { label: "Không bết dính", value: "21" },
        { label: "Giá tốt", value: "18" },
      ],
      reviewImageUrls: ["/products/perfume-5.png"],
      qualityCertifications: sharedCertifications,
      packagingAttributes: [
        { label: "Quy cách", value: "1 tuýp" },
        { label: "Khối lượng", value: "80g" },
        { label: "Kích thước", value: "13 x 4 x 3 cm" },
      ],
      images: [
        { imageUrl: "/products/perfume-4.png", altText: "Kem dưỡng tay", sortOrder: 1 },
        { imageUrl: "/products/perfume-5.png", altText: "Kem dưỡng tay chi tiết", sortOrder: 2 },
      ],
      colorVariants: [
        {
          name: "Hương hoa trắng",
          colorCode: "#f4efe8",
          imageUrl: "/products/perfume-4.png",
          sku: "NIK-HAND-CREAM-004-WHT",
          sortOrder: 1,
        },
        {
          name: "Hương trà xanh",
          colorCode: "#b7c68b",
          imageUrl: "/products/perfume-5.png",
          sku: "NIK-HAND-CREAM-004-GRN",
          sortOrder: 2,
        },
      ],
    },
    {
      sku: "NIK-TOOTHPASTE-005",
      slug: "kem-danh-rang-lam-trang-diu-nhe",
      name: "Kem đánh răng làm trắng dịu nhẹ",
      description:
        "Kem đánh răng chăm sóc khoang miệng hằng ngày, hương bạc hà nhẹ, hỗ trợ làm sạch mảng bám bề mặt.",
      listedPrice: 52000n,
      imageUrl: "/products/perfume-7.png",
      stockQuantity: 130000,
      sortOrder: 5,
      productAttributes: [
        { label: "Dung tích", value: "120g" },
        { label: "Hương", value: "Bạc hà" },
        { label: "Đối tượng", value: "Người lớn" },
        { label: "Hiệu quả", value: "Làm sạch, thơm miệng" },
      ],
      detailImageUrls: ["/products/perfume-7.png", "/products/perfume-8.png"],
      sellerName: "Nhà máy chăm sóc răng miệng Bright Lab",
      sellerYears: 7,
      sellerPrimaryCategory: "Chăm sóc răng miệng",
      minimumOrderQuantity: 4,
      shippingOrigin: "Phật Sơn, Quảng Đông",
      shippingLeadTime: "Giao hàng trong 48 giờ",
      returnPolicy: "Đổi trả sản phẩm lỗi niêm phong",
      reviewRating: "4.30",
      reviewCount: 88,
      reviewTags: [
        { label: "Hương bạc hà nhẹ", value: "14" },
        { label: "Đóng gói tốt", value: "10+" },
        { label: "Dùng ổn", value: "9" },
      ],
      reviewImageUrls: ["/products/perfume-7.png"],
      qualityCertifications: sharedCertifications,
      packagingAttributes: [
        { label: "Quy cách", value: "1 tuýp/hộp" },
        { label: "Khối lượng", value: "150g" },
        { label: "Hạn dùng", value: "36 tháng" },
      ],
      images: [
        { imageUrl: "/products/perfume-7.png", altText: "Kem đánh răng", sortOrder: 1 },
        { imageUrl: "/products/perfume-8.png", altText: "Kem đánh răng chi tiết", sortOrder: 2 },
      ],
      colorVariants: [
        {
          name: "Bạc hà trắng",
          colorCode: "#d8edf4",
          imageUrl: "/products/perfume-7.png",
          sku: "NIK-TOOTHPASTE-005-MNT",
          sortOrder: 1,
        },
        {
          name: "Than hoạt tính",
          colorCode: "#242424",
          imageUrl: "/products/perfume-8.png",
          sku: "NIK-TOOTHPASTE-005-CHR",
          sortOrder: 2,
        },
      ],
    },
    {
      sku: "NIK-SKINCARE-SET-006",
      slug: "bo-cham-soc-da-cap-am-phuc-hoi",
      name: "Bộ chăm sóc da cấp ẩm phục hồi",
      description:
        "Bộ chăm sóc da gồm sữa rửa mặt, toner, serum và kem dưỡng. Tập trung cấp ẩm, làm dịu bề mặt da và phục hồi hàng rào bảo vệ sau khi da khô căng do thời tiết hoặc điều hòa.",
      listedPrice: 189000n,
      imageUrl: "/products/perfume-9.png",
      stockQuantity: 98500,
      sortOrder: 6,
      productAttributes: [
        { label: "Loại sản phẩm", value: "Set chăm sóc da 4 bước" },
        { label: "Thành phần nổi bật", value: "HA, ceramide, chiết xuất rau má" },
        { label: "Loại da phù hợp", value: "Da khô, da hỗn hợp thiên khô" },
        { label: "Hiệu quả", value: "Cấp ẩm, làm dịu, hỗ trợ phục hồi" },
        { label: "Dung tích", value: "80ml + 120ml + 30ml + 50g" },
        { label: "Hạn sử dụng", value: "36 tháng" },
        { label: "Xuất xứ", value: "Quảng Châu, Quảng Đông" },
        { label: "Quy cách bán", value: "1 set/hộp quà" },
      ],
      detailImageUrls: [
        "/products/perfume-9.png",
        "/products/perfume-8.png",
        "/products/perfume-6.png",
        "/products/perfume-7.png",
      ],
      sellerName: "Công ty mỹ phẩm Green Lab Quảng Châu",
      sellerYears: 8,
      sellerPrimaryCategory: "Chăm sóc da mặt",
      minimumOrderQuantity: 2,
      shippingOrigin: "Quảng Châu, Quảng Đông",
      shippingLeadTime: "Gửi hàng trong 24 giờ, hỗ trợ đơn bổ sung",
      returnPolicy: "Đổi trả miễn phí khi lỗi sản xuất hoặc vỡ hỏng khi nhận hàng",
      reviewRating: "4.80",
      reviewCount: 326,
      reviewTags: [
        { label: "Cấp ẩm tốt", value: "40+" },
        { label: "Bao bì sang", value: "28" },
        { label: "Da dịu hơn", value: "23" },
        { label: "Đóng gói chắc", value: "19" },
        { label: "Mua lại nhiều", value: "15" },
      ],
      reviewImageUrls: [
        "/products/perfume-9.png",
        "/products/perfume-8.png",
        "/products/perfume-6.png",
      ],
      qualityCertifications: [
        ...sharedCertifications,
        { label: "Số kiểm nghiệm", value: "GD-COS-20260724006" },
        { label: "Tiêu chuẩn đóng gói", value: "Hộp niêm phong, tem lô và hạn dùng rõ ràng" },
        { label: "Lưu ý", value: "Ngưng sử dụng nếu da có phản ứng bất thường." },
      ],
      packagingAttributes: [
        { label: "Phân loại", value: "Set xanh làm dịu, set trắng cấp ẩm, set hồng phục hồi" },
        { label: "Khối lượng", value: "680g" },
        { label: "Kích thước hộp", value: "24 x 18 x 7 cm" },
        { label: "Đóng gói vận chuyển", value: "Hộp quà + túi chống sốc + thùng carton" },
        { label: "Số lượng/thùng", value: "24 set/thùng" },
        { label: "Phụ kiện kèm theo", value: "Muỗng lấy kem, hướng dẫn sử dụng, tem lô hàng" },
      ],
      images: [
        { imageUrl: "/products/perfume-9.png", altText: "Bộ chăm sóc da cấp ẩm", sortOrder: 1 },
        {
          imageUrl: "/products/perfume-8.png",
          altText: "Bộ chăm sóc da phục hồi chi tiết",
          sortOrder: 2,
        },
        {
          imageUrl: "/products/perfume-6.png",
          altText: "Bộ chăm sóc da hộp quà",
          sortOrder: 3,
        },
        {
          imageUrl: "/products/perfume-7.png",
          altText: "Bộ chăm sóc da review bao bì",
          sortOrder: 4,
        },
      ],
      colorVariants: [
        {
          name: "Set xanh làm dịu",
          colorCode: "#8fb8a3",
          imageUrl: "/products/perfume-9.png",
          sku: "NIK-SKINCARE-SET-006-GRN",
          sortOrder: 1,
        },
        {
          name: "Set trắng cấp ẩm",
          colorCode: "#f5f0e6",
          imageUrl: "/products/perfume-8.png",
          sku: "NIK-SKINCARE-SET-006-WHT",
          sortOrder: 2,
        },
        {
          name: "Set hồng phục hồi",
          colorCode: "#e9a8b4",
          imageUrl: "/products/perfume-6.png",
          sku: "NIK-SKINCARE-SET-006-PNK",
          sortOrder: 3,
        },
        {
          name: "Set mini dùng thử",
          colorCode: "#d7c59a",
          imageUrl: "/products/perfume-7.png",
          sku: "NIK-SKINCARE-SET-006-MINI",
          sortOrder: 4,
        },
      ],
    },
  ];

  const seededProducts = [];
  for (const product of products) {
    const seededProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        productAttributes: json(product.productAttributes),
        detailImageUrls: json(product.detailImageUrls),
        sellerName: product.sellerName,
        sellerYears: product.sellerYears,
        sellerPrimaryCategory: product.sellerPrimaryCategory,
        minimumOrderQuantity: product.minimumOrderQuantity,
        shippingOrigin: product.shippingOrigin,
        shippingLeadTime: product.shippingLeadTime,
        returnPolicy: product.returnPolicy,
        reviewRating: product.reviewRating,
        reviewCount: product.reviewCount,
        reviewTags: json(product.reviewTags),
        reviewImageUrls: json(product.reviewImageUrls),
        qualityCertifications: json(product.qualityCertifications),
        packagingAttributes: json(product.packagingAttributes),
        listedPrice: product.listedPrice,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        discountAmount: 25000n,
        isPromotionEligible: true,
        isActive: true,
        sortOrder: product.sortOrder,
      },
      create: {
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        description: product.description,
        productAttributes: json(product.productAttributes),
        detailImageUrls: json(product.detailImageUrls),
        sellerName: product.sellerName,
        sellerYears: product.sellerYears,
        sellerPrimaryCategory: product.sellerPrimaryCategory,
        minimumOrderQuantity: product.minimumOrderQuantity,
        shippingOrigin: product.shippingOrigin,
        shippingLeadTime: product.shippingLeadTime,
        returnPolicy: product.returnPolicy,
        reviewRating: product.reviewRating,
        reviewCount: product.reviewCount,
        reviewTags: json(product.reviewTags),
        reviewImageUrls: json(product.reviewImageUrls),
        qualityCertifications: json(product.qualityCertifications),
        packagingAttributes: json(product.packagingAttributes),
        listedPrice: product.listedPrice,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        sortOrder: product.sortOrder,
        discountAmount: 25000n,
        isPromotionEligible: true,
        isActive: true,
      },
    });
    await prisma.productImage.deleteMany({ where: { productId: seededProduct.id } });
    await prisma.productColorVariant.deleteMany({ where: { productId: seededProduct.id } });
    await prisma.productImage.createMany({
      data: product.images.map((image) => ({
        altText: image.altText,
        imageUrl: image.imageUrl,
        productId: seededProduct.id,
        sortOrder: image.sortOrder,
      })),
    });
    await prisma.productColorVariant.createMany({
      data: product.colorVariants.map((variant) => ({
        colorCode: variant.colorCode,
        imageUrl: variant.imageUrl,
        name: variant.name,
        productId: seededProduct.id,
        sku: variant.sku,
        sortOrder: variant.sortOrder,
      })),
    });
    seededProducts.push(seededProduct);
  }

  const customerPhones = [
    { phone: "0901234567", source: "manual" as const, reason: "manual" as const },
    { phone: "0902345678", source: "import" as const, reason: "imported" as const },
    { phone: "0903456789", source: "sheet" as const, reason: "purchased" as const },
    { phone: "0904567890", source: "pancake" as const, reason: "delivered" as const },
  ];
  const seededCustomers = [];
  for (const customer of customerPhones) {
    const seededCustomer = await prisma.eligibleCustomer.upsert({
      where: { phoneHash: hashSensitiveValue(customer.phone) },
      update: {
        phoneNormalized: customer.phone,
        source: customer.source,
        eligibilityReason: customer.reason,
        isActive: true,
      },
      create: {
        phoneNormalized: customer.phone,
        phoneHash: hashSensitiveValue(customer.phone),
        source: customer.source,
        eligibilityReason: customer.reason,
        isActive: true,
      },
    });
    seededCustomers.push(seededCustomer);
  }

  const seedOrderCodes = ["DEVORDER001", "DEVORDER002"];
  const oldSeedOrders = await prisma.order.findMany({
    where: { orderCode: { in: seedOrderCodes } },
    select: { id: true },
  });
  const oldSeedOrderIds = oldSeedOrders.map((order) => order.id);
  if (oldSeedOrderIds.length > 0) {
    await prisma.integrationLog.deleteMany({ where: { orderId: { in: oldSeedOrderIds } } });
    await prisma.integrationJob.deleteMany({ where: { orderId: { in: oldSeedOrderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: oldSeedOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: oldSeedOrderIds } } });
  }

  const firstProduct = seededProducts[0];
  const secondProduct = seededProducts[1];
  const thirdProduct = seededProducts[2];
  const firstCustomer = seededCustomers[0];
  const secondCustomer = seededCustomers[1];
  if (!firstProduct || !secondProduct || !thirdProduct || !firstCustomer || !secondCustomer) {
    throw new Error("Development seed requires at least three products and two eligible customers");
  }

  const firstOrderSubtotal = firstProduct.listedPrice * 2n + secondProduct.listedPrice;
  const firstOrderDiscount = firstProduct.discountAmount * 2n + secondProduct.discountAmount;
  const firstOrderShipping = 30000n;
  const firstOrder = await prisma.order.create({
    data: {
      orderCode: "DEVORDER001",
      idempotencyKey: "seed-dev-order-001",
      eligibleCustomerId: firstCustomer.id,
      promotionPhone: firstCustomer.phoneNormalized,
      promotionPhoneHash: firstCustomer.phoneHash,
      isPromotionApplied: true,
      recipientName: "Nguyễn Văn A",
      recipientPhone: "0901234567",
      province: "TP. Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Nghé",
      address: "12 Nguyễn Huệ",
      totalQuantity: 3,
      subtotal: firstOrderSubtotal,
      discountAmount: firstOrderDiscount,
      shippingFee: firstOrderShipping,
      totalAmount: firstOrderSubtotal - firstOrderDiscount + firstOrderShipping,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "pending",
      note: "Đơn mẫu development.",
      items: {
        create: [
          {
            productId: firstProduct.id,
            sku: firstProduct.sku,
            productName: firstProduct.name,
            listedPrice: firstProduct.listedPrice,
            discountPerItem: firstProduct.discountAmount,
            finalUnitPrice: firstProduct.listedPrice - firstProduct.discountAmount,
            quantity: 2,
            lineSubtotal: firstProduct.listedPrice * 2n,
            lineDiscount: firstProduct.discountAmount * 2n,
            lineTotal: (firstProduct.listedPrice - firstProduct.discountAmount) * 2n,
          },
          {
            productId: secondProduct.id,
            sku: secondProduct.sku,
            productName: secondProduct.name,
            listedPrice: secondProduct.listedPrice,
            discountPerItem: secondProduct.discountAmount,
            finalUnitPrice: secondProduct.listedPrice - secondProduct.discountAmount,
            quantity: 1,
            lineSubtotal: secondProduct.listedPrice,
            lineDiscount: secondProduct.discountAmount,
            lineTotal: secondProduct.listedPrice - secondProduct.discountAmount,
          },
        ],
      },
    },
  });

  const secondOrderSubtotal = thirdProduct.listedPrice;
  const secondOrderDiscount = thirdProduct.discountAmount;
  const secondOrderShipping = 30000n;
  const secondOrder = await prisma.order.create({
    data: {
      orderCode: "DEVORDER002",
      idempotencyKey: "seed-dev-order-002",
      eligibleCustomerId: secondCustomer.id,
      promotionPhone: secondCustomer.phoneNormalized,
      promotionPhoneHash: secondCustomer.phoneHash,
      isPromotionApplied: true,
      recipientName: "Trần Thị B",
      recipientPhone: "0902345678",
      province: "Hà Nội",
      district: "Ba Đình",
      ward: "Phúc Xá",
      address: "8 Trúc Bạch",
      totalQuantity: 1,
      subtotal: secondOrderSubtotal,
      discountAmount: secondOrderDiscount,
      shippingFee: secondOrderShipping,
      totalAmount: secondOrderSubtotal - secondOrderDiscount + secondOrderShipping,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "confirmed",
      note: "Đơn mẫu có lỗi đồng bộ để kiểm tra retry.",
      items: {
        create: [
          {
            productId: thirdProduct.id,
            sku: thirdProduct.sku,
            productName: thirdProduct.name,
            listedPrice: thirdProduct.listedPrice,
            discountPerItem: thirdProduct.discountAmount,
            finalUnitPrice: thirdProduct.listedPrice - thirdProduct.discountAmount,
            quantity: 1,
            lineSubtotal: thirdProduct.listedPrice,
            lineDiscount: thirdProduct.discountAmount,
            lineTotal: thirdProduct.listedPrice - thirdProduct.discountAmount,
          },
        ],
      },
    },
  });

  for (const integration of ["pancake", "sheet"] as const) {
    const job = await prisma.integrationJob.create({
      data: {
        action: "create",
        integration,
        orderId: firstOrder.id,
        requestPayload: { orderCode: firstOrder.orderCode },
        status: "pending",
      },
    });
    await prisma.integrationLog.create({
      data: {
        action: "create",
        integration,
        integrationJobId: job.id,
        orderId: firstOrder.id,
        requestPayload: { orderCode: firstOrder.orderCode },
        status: "pending",
      },
    });
  }

  const failedJob = await prisma.integrationJob.create({
    data: {
      action: "create",
      attemptCount: 1,
      integration: "pancake",
      lastError: "Development mock integration failed",
      nextRetryAt: new Date(Date.now() + 10 * 60 * 1000),
      orderId: secondOrder.id,
      requestPayload: { orderCode: secondOrder.orderCode },
      status: "failed",
    },
  });
  await prisma.integrationLog.create({
    data: {
      action: "create",
      attemptCount: 1,
      errorMessage: "Development mock integration failed",
      integration: "pancake",
      integrationJobId: failedJob.id,
      nextRetryAt: failedJob.nextRetryAt,
      orderId: secondOrder.id,
      requestPayload: { orderCode: secondOrder.orderCode },
      status: "failed",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "create",
      adminId: admin.id,
      entityId: firstOrder.orderCode,
      entityType: "seed",
      metadata: { note: "Development seed data refreshed" },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
