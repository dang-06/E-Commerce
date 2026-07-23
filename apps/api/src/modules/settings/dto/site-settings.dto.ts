import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

const imagePathPattern = /^(https?:\/\/[^\s]+|\/[^\s]+)$/;

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({ example: "ROSA PERFUME", maxLength: 120, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bannerEyebrow?: string;

  @ApiPropertyOptional({
    example: "Wear the Story of Every Moment with Distinction",
    maxLength: 255,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bannerTitle?: string;

  @ApiPropertyOptional({
    example: "Khám phá bộ sưu tập đang có sẵn.",
    maxLength: 500,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bannerSubtitle?: string;

  @ApiPropertyOptional({ example: "Xem thêm", maxLength: 80, type: String })
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
}

export class SiteSettingsResponseDto {
  @ApiProperty({ example: "ROSA PERFUME", type: String })
  bannerEyebrow!: string;

  @ApiProperty({ example: "Wear the Story of Every Moment with Distinction", type: String })
  bannerTitle!: string;

  @ApiProperty({ example: "Khám phá bộ sưu tập đang có sẵn.", type: String })
  bannerSubtitle!: string;

  @ApiProperty({ example: "Xem thêm", type: String })
  bannerButtonText!: string;

  @ApiPropertyOptional({ example: "/products/perfume-1.png", nullable: true, type: String })
  bannerImageUrl!: string | null;

  @ApiProperty({ example: "2026-07-23T09:00:00.000Z", format: "date-time", type: String })
  updatedAt!: Date;
}
