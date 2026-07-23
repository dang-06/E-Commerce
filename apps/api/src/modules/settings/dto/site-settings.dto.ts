import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

const imagePathPattern = /^(https?:\/\/[^\s]+|\/[^\s]+)$/;

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({ example: "Tên thương hiệu", maxLength: 120, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bannerEyebrow?: string;

  @ApiPropertyOptional({
    example: "Tiêu đề banner",
    maxLength: 255,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bannerTitle?: string;

  @ApiPropertyOptional({
    example: "Mô tả banner",
    maxLength: 500,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bannerSubtitle?: string;

  @ApiPropertyOptional({ example: "Xem sản phẩm", maxLength: 80, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  bannerButtonText?: string;

  @ApiPropertyOptional({ example: "/products/perfume-1.png", maxLength: 2048, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "bannerImageUrl must be an http(s) URL or an absolute public path",
  })
  bannerImageUrl?: string | null;

  @ApiPropertyOptional({ example: "Sản phẩm nổi bật", maxLength: 120, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  catalogTitle?: string;

  @ApiPropertyOptional({ example: "Tên thương hiệu", maxLength: 120, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  logoText?: string;

  @ApiPropertyOptional({ example: "/uploads/logo.png", maxLength: 2048, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(imagePathPattern, {
    message: "logoImageUrl must be an http(s) URL or an absolute public path",
  })
  logoImageUrl?: string | null;
}

export class SiteSettingsResponseDto {
  @ApiProperty({ example: "Tên thương hiệu", type: String })
  bannerEyebrow!: string;

  @ApiProperty({ example: "Tiêu đề banner", type: String })
  bannerTitle!: string;

  @ApiProperty({ example: "Mô tả banner", type: String })
  bannerSubtitle!: string;

  @ApiProperty({ example: "Xem sản phẩm", type: String })
  bannerButtonText!: string;

  @ApiPropertyOptional({ example: "/products/perfume-1.png", nullable: true, type: String })
  bannerImageUrl!: string | null;

  @ApiProperty({ example: "Sản phẩm nổi bật", type: String })
  catalogTitle!: string;

  @ApiProperty({ example: "Tên thương hiệu", type: String })
  logoText!: string;

  @ApiPropertyOptional({ example: "/uploads/logo.png", nullable: true, type: String })
  logoImageUrl!: string | null;

  @ApiProperty({ example: "2026-07-23T09:00:00.000Z", format: "date-time", type: String })
  updatedAt!: Date;
}
