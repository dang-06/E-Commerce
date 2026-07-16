import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
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
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "imageUrl must be an http(s) URL or an absolute public path",
  })
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class ProductColorVariantInputDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(colorCodePattern, {
    message: "colorCode must be a hex color like #F4C7C3",
  })
  colorCode?: string;

  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "imageUrl must be an http(s) URL or an absolute public path",
  })
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  @MaxLength(50)
  @Matches(skuPattern)
  sku!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(255)
  @Matches(slugPattern)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "imageUrl must be an http(s) URL or an absolute public path",
  })
  imageUrl?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  listedPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isPromotionEligible?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorVariantInputDto)
  colorVariants?: ProductColorVariantInputDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(skuPattern)
  sku?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(slugPattern)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "imageUrl must be an http(s) URL or an absolute public path",
  })
  imageUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  listedPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number | null;

  @IsOptional()
  @IsBoolean()
  isPromotionEligible?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorVariantInputDto)
  colorVariants?: ProductColorVariantInputDto[];
}

export class SetProductVisibilityDto {
  @IsBoolean()
  isActive!: boolean;
}
