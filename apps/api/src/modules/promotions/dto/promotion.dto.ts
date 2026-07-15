import { Transform, Type } from "class-transformer";
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
  @IsString()
  @MaxLength(32)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  captchaToken?: string;
}

export class ImportEligibleCustomersDto {
  @IsString()
  @IsIn(customerSources)
  source!: CustomerSourceValue;

  @IsOptional()
  @IsString()
  @IsIn(eligibilityReasons)
  eligibilityReason?: EligibilityReasonValue;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceCustomerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceLabel?: string;
}

export class ListEligibleCustomersQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === "true")
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(customerSources)
  source?: CustomerSourceValue;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SetEligibleCustomerStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

