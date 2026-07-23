import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "failed"] as const;
const numericIdPattern = /^\d+$/;
const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{12,100}$/;

export type PaymentMethodValue = (typeof paymentMethods)[number];
export type OrderStatusValue = (typeof orderStatuses)[number];

export class OrderItemInputDto {
  @ApiProperty({ example: "1", pattern: "^\\d+$" })
  @IsString()
  @Matches(numericIdPattern)
  productId!: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 99 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class RecipientInputDto {
  @ApiProperty({ example: "Nguyen Van A", maxLength: 150 })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: "0912345678", maxLength: 32 })
  @IsString()
  @MaxLength(32)
  phone!: string;

  @ApiProperty({ example: "Ho Chi Minh", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  province!: string;

  @ApiProperty({ example: "Quan 1", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  district!: string;

  @ApiProperty({ example: "Phuong Ben Nghe", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  ward!: string;

  @ApiProperty({ example: "123 Nguyen Hue", maxLength: 500 })
  @IsString()
  @MaxLength(500)
  address!: string;
}

export class QuoteOrderDto {
  @ApiProperty({ example: "checkout-20260721-0001", minLength: 12, maxLength: 100 })
  @IsString()
  @Matches(idempotencyKeyPattern)
  idempotencyKey!: string;

  @ApiPropertyOptional({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  promotionToken?: string;

  @ApiPropertyOptional({ example: "0912345678", maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  promotionPhone?: string;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @ApiPropertyOptional({ enum: paymentMethods, example: "cod" })
  @IsOptional()
  @IsString()
  @IsIn(paymentMethods)
  paymentMethod?: PaymentMethodValue;
}

export class CreateOrderDto extends QuoteOrderDto {
  @ApiProperty({ type: RecipientInputDto })
  @ValidateNested()
  @Type(() => RecipientInputDto)
  recipient!: RecipientInputDto;

  @ApiPropertyOptional({ example: "Giao hang gio hanh chinh", maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: orderStatuses, example: "confirmed" })
  @IsString()
  @IsIn(orderStatuses)
  status!: OrderStatusValue;
}
