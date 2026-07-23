import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const customerSources = ["sheet", "pancake", "best", "import", "manual"] as const;
const eligibilityReasons = ["delivered", "purchased", "manual", "imported"] as const;

export type CustomerSourceValue = (typeof customerSources)[number];
export type EligibilityReasonValue = (typeof eligibilityReasons)[number];

export class CheckPromotionDto {
  @ApiProperty({ example: "0912345678", maxLength: 32 })
  @IsString()
  @MaxLength(32)
  phone!: string;

  @ApiPropertyOptional({ example: "captcha-token", maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  captchaToken?: string;
}

export class ImportEligibleCustomersDto {
  @ApiProperty({ enum: customerSources, example: "import" })
  @IsString()
  @IsIn(customerSources)
  source!: CustomerSourceValue;

  @ApiPropertyOptional({ enum: eligibilityReasons, example: "imported" })
  @IsOptional()
  @IsString()
  @IsIn(eligibilityReasons)
  eligibilityReason?: EligibilityReasonValue;

  @ApiPropertyOptional({ example: "CRM-1001", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceCustomerId?: string;

  @ApiPropertyOptional({ example: "July imported list", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceLabel?: string;
}

export class ListEligibleCustomersQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === "true")
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: customerSources, example: "sheet" })
  @IsOptional()
  @IsString()
  @IsIn(customerSources)
  source?: CustomerSourceValue;

  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SetEligibleCustomerStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}
