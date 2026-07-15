import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

const paymentMethods = ["cod", "bank_transfer", "online"] as const;
const numericIdPattern = /^\d+$/;
const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{12,100}$/;

export type PaymentMethodValue = (typeof paymentMethods)[number];

export class OrderItemInputDto {
  @IsString()
  @Matches(numericIdPattern)
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class RecipientInputDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsString()
  @MaxLength(32)
  phone!: string;

  @IsString()
  @MaxLength(100)
  province!: string;

  @IsString()
  @MaxLength(100)
  district!: string;

  @IsString()
  @MaxLength(100)
  ward!: string;

  @IsString()
  @MaxLength(500)
  address!: string;
}

export class QuoteOrderDto {
  @IsString()
  @Matches(idempotencyKeyPattern)
  idempotencyKey!: string;

  @IsString()
  @MaxLength(2048)
  promotionToken!: string;

  @IsString()
  @MaxLength(32)
  promotionPhone!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @IsOptional()
  @IsString()
  @IsIn(paymentMethods)
  paymentMethod?: PaymentMethodValue;
}

export class CreateOrderDto extends QuoteOrderDto {
  @ValidateNested()
  @Type(() => RecipientInputDto)
  recipient!: RecipientInputDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
