import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

const imagePathPattern = /^(https?:\/\/[^\s]+|\/[^\s]+)$/;
const colorCodePattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const skuPattern = /^[A-Z0-9][A-Z0-9._-]{1,49}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ProductImageInputDto {
  @ApiProperty({ example: "/products/perfume-1.png" })
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "imageUrl must be an http(s) URL or an absolute public path",
  })
  imageUrl!: string;

  @ApiPropertyOptional({ example: "Front product image" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 9999 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class ProductAttributeInputDto {
  @ApiProperty({ example: "Chất liệu", type: String })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: "Cotton", type: String })
  @IsString()
  @MaxLength(255)
  value!: string;
}

export class ProductColorVariantInputDto {
  @ApiProperty({ example: "Pink" })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: "#F4C7C3" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(colorCodePattern, {
    message: "colorCode must be a hex color like #F4C7C3",
  })
  colorCode?: string;

  @ApiProperty({ example: "/products/perfume-pink.png" })
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "imageUrl must be an http(s) URL or an absolute public path",
  })
  imageUrl!: string;

  @ApiPropertyOptional({ example: "PERFUME-PINK" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 9999 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: "PERFUME-001", maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @Matches(skuPattern)
  sku!: string;

  @ApiProperty({ example: "Nuoc hoa Floral 50ml", maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: "nuoc-hoa-floral-50ml", maxLength: 255 })
  @IsString()
  @MaxLength(255)
  @Matches(slugPattern)
  slug!: string;

  @ApiPropertyOptional({ example: "Mui huong nhe, phu hop dung hang ngay.", maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: "/products/perfume-1.png", maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "imageUrl must be an http(s) URL or an absolute public path",
  })
  imageUrl?: string;

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  productAttributes?: ProductAttributeInputDto[];

  @ApiPropertyOptional({ example: ["/products/detail-1.png"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @Matches(imagePathPattern, {
    each: true,
    message: "detailImageUrls must contain http(s) URLs or absolute public paths",
  })
  detailImageUrls?: string[];

  @ApiPropertyOptional({ example: "Công ty TNHH Công nghệ", maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sellerName?: string;

  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 100, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  sellerYears?: number;

  @ApiPropertyOptional({ example: "Sản phẩm chăm sóc tóc", maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sellerPrimaryCategory?: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 9999, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  minimumOrderQuantity?: number;

  @ApiPropertyOptional({ example: "Sán Đầu, Quảng Đông", maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingOrigin?: string;

  @ApiPropertyOptional({ example: "Giao hàng trong vòng 48 giờ", maxLength: 120, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingLeadTime?: string;

  @ApiPropertyOptional({ example: "Miễn phí vận chuyển trả hàng", maxLength: 255, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  returnPolicy?: string;

  @ApiPropertyOptional({ example: 4.4, minimum: 0, maximum: 5, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  reviewRating?: number;

  @ApiPropertyOptional({ example: 70, minimum: 0, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reviewCount?: number;

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  reviewTags?: ProductAttributeInputDto[];

  @ApiPropertyOptional({ example: ["/products/review-1.png"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @Matches(imagePathPattern, {
    each: true,
    message: "reviewImageUrls must contain http(s) URLs or absolute public paths",
  })
  reviewImageUrls?: string[];

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  qualityCertifications?: ProductAttributeInputDto[];

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  packagingAttributes?: ProductAttributeInputDto[];

  @ApiProperty({ example: 350000, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  listedPrice!: number;

  @ApiPropertyOptional({ example: 25, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPromotionEligible?: boolean;

  @ApiPropertyOptional({ example: 25000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 9999 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [ProductImageInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];

  @ApiPropertyOptional({ type: [ProductColorVariantInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorVariantInputDto)
  colorVariants?: ProductColorVariantInputDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: "PERFUME-001", maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(skuPattern)
  sku?: string;

  @ApiPropertyOptional({ example: "Nuoc hoa Floral 50ml", maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: "nuoc-hoa-floral-50ml", maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(slugPattern)
  slug?: string;

  @ApiPropertyOptional({ example: "Mui huong nhe, phu hop dung hang ngay.", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ example: "/products/perfume-1.png", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "imageUrl must be an http(s) URL or an absolute public path",
  })
  imageUrl?: string | null;

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  productAttributes?: ProductAttributeInputDto[];

  @ApiPropertyOptional({ example: ["/products/detail-1.png"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @Matches(imagePathPattern, {
    each: true,
    message: "detailImageUrls must contain http(s) URLs or absolute public paths",
  })
  detailImageUrls?: string[];

  @ApiPropertyOptional({ example: "Công ty TNHH Công nghệ", nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sellerName?: string | null;

  @ApiPropertyOptional({ example: 3, minimum: 0, maximum: 100, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  sellerYears?: number | null;

  @ApiPropertyOptional({ example: "Sản phẩm chăm sóc tóc", nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sellerPrimaryCategory?: string | null;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 9999, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  minimumOrderQuantity?: number;

  @ApiPropertyOptional({ example: "Sán Đầu, Quảng Đông", nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingOrigin?: string | null;

  @ApiPropertyOptional({ example: "Giao hàng trong vòng 48 giờ", nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingLeadTime?: string | null;

  @ApiPropertyOptional({ example: "Miễn phí vận chuyển trả hàng", nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  returnPolicy?: string | null;

  @ApiPropertyOptional({ example: 4.4, minimum: 0, maximum: 5, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  reviewRating?: number | null;

  @ApiPropertyOptional({ example: 70, minimum: 0, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reviewCount?: number | null;

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  reviewTags?: ProductAttributeInputDto[];

  @ApiPropertyOptional({ example: ["/products/review-1.png"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @Matches(imagePathPattern, {
    each: true,
    message: "reviewImageUrls must contain http(s) URLs or absolute public paths",
  })
  reviewImageUrls?: string[];

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  qualityCertifications?: ProductAttributeInputDto[];

  @ApiPropertyOptional({ type: [ProductAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeInputDto)
  packagingAttributes?: ProductAttributeInputDto[];

  @ApiPropertyOptional({ example: 350000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  listedPrice?: number;

  @ApiPropertyOptional({ example: 25, minimum: 0, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPromotionEligible?: boolean;

  @ApiPropertyOptional({ example: 25000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 9999 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [ProductImageInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];

  @ApiPropertyOptional({ type: [ProductColorVariantInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorVariantInputDto)
  colorVariants?: ProductColorVariantInputDto[];
}

export class SetProductVisibilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}
