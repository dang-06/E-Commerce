import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductImageResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "/products/perfume-1.png", type: String })
  imageUrl!: string;

  @ApiPropertyOptional({ example: "Front product image", nullable: true, type: String })
  altText!: string | null;

  @ApiProperty({ example: 0, type: Number })
  sortOrder!: number;
}

export class ProductColorVariantResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "Pink", type: String })
  name!: string;

  @ApiPropertyOptional({ example: "#F4C7C3", nullable: true, type: String })
  colorCode!: string | null;

  @ApiProperty({ example: "/products/perfume-pink.png", type: String })
  imageUrl!: string;

  @ApiPropertyOptional({ example: "PERFUME-PINK", nullable: true, type: String })
  sku!: string | null;

  @ApiProperty({ example: 0, type: Number })
  sortOrder!: number;
}

export class ProductResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "PERFUME-001", type: String })
  sku!: string;

  @ApiProperty({ example: "Nuoc hoa Floral 50ml", type: String })
  name!: string;

  @ApiProperty({ example: "nuoc-hoa-floral-50ml", type: String })
  slug!: string;

  @ApiPropertyOptional({ example: "Mui huong nhe, phu hop dung hang ngay.", nullable: true, type: String })
  description!: string | null;

  @ApiPropertyOptional({ example: "/products/perfume-1.png", nullable: true, type: String })
  imageUrl!: string | null;

  @ApiProperty({
    description: "VND amount serialized as a string.",
    example: "350000",
    type: String,
  })
  listedPrice!: string;

  @ApiPropertyOptional({ example: 25, nullable: true, type: Number })
  stockQuantity!: number | null;

  @ApiProperty({ example: true, type: Boolean })
  isPromotionEligible!: boolean;

  @ApiProperty({
    description: "VND amount serialized as a string.",
    example: "25000",
    type: String,
  })
  discountAmount!: string;

  @ApiProperty({ example: true, type: Boolean })
  isActive!: boolean;

  @ApiProperty({ example: 0, type: Number })
  sortOrder!: number;

  @ApiPropertyOptional({ example: null, format: "date-time", nullable: true, type: String })
  deletedAt!: Date | null;

  @ApiProperty({ type: [ProductImageResponseDto] })
  images!: ProductImageResponseDto[];

  @ApiProperty({ type: [ProductColorVariantResponseDto] })
  colorVariants!: ProductColorVariantResponseDto[];

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  createdAt!: Date;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  updatedAt!: Date;
}

export class UploadedProductImageResponseDto {
  @ApiProperty({
    example: "https://res.cloudinary.com/demo/image/upload/v123/ecommerce-products/item.webp",
    type: String,
  })
  imageUrl!: string;

  @ApiProperty({ example: "ecommerce-products/item", type: String })
  publicId!: string;

  @ApiPropertyOptional({ example: 1200, nullable: true, type: Number })
  width!: number | null;

  @ApiPropertyOptional({ example: 1200, nullable: true, type: Number })
  height!: number | null;

  @ApiPropertyOptional({ example: "webp", nullable: true, type: String })
  format!: string | null;
}
