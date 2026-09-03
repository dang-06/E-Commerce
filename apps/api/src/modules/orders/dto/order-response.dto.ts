import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class OrderLineResponseDto {
  @ApiProperty({ example: "1", type: String })
  productId!: string;

  @ApiProperty({ example: "PERFUME-001", type: String })
  sku!: string;

  @ApiProperty({ example: "Nuoc hoa Floral 50ml", type: String })
  productName!: string;

  @ApiProperty({ example: "350000", type: String })
  listedPrice!: string;

  @ApiProperty({ example: "25000", type: String })
  discountPerItem!: string;

  @ApiProperty({ example: "325000", type: String })
  finalUnitPrice!: string;

  @ApiProperty({ example: 2, type: Number })
  quantity!: number;

  @ApiProperty({ example: "700000", type: String })
  lineSubtotal!: string;

  @ApiProperty({ example: "50000", type: String })
  lineDiscount!: string;

  @ApiProperty({ example: "650000", type: String })
  lineTotal!: string;
}

export class OrderQuoteResponseDto {
  @ApiProperty({ example: "quoted", type: String })
  status!: "quoted";

  @ApiProperty({ example: "checkout-20260721-0001", type: String })
  idempotencyKey!: string;

  @ApiProperty({ example: 2, type: Number })
  totalQuantity!: number;

  @ApiProperty({ example: "700000", type: String })
  subtotal!: string;

  @ApiProperty({ example: "50000", type: String })
  discountAmount!: string;

  @ApiProperty({ example: "0", type: String })
  shippingFee!: string;

  @ApiProperty({ example: "650000", type: String })
  totalAmount!: string;

  @ApiProperty({ example: "2026-07-21T09:15:00.000Z", format: "date-time", type: String })
  expiresAt!: string;

  @ApiProperty({ type: [OrderLineResponseDto] })
  items!: OrderLineResponseDto[];
}

export class CreateOrderResponseDto {
  @ApiProperty({ enum: ["created", "duplicate"], example: "created", type: String })
  status!: "created" | "duplicate";

  @ApiProperty({ example: "DH202607210001", type: String })
  orderCode!: string;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  createdAt!: Date;

  @ApiProperty({ example: 2, type: Number })
  totalQuantity!: number;

  @ApiProperty({ example: "700000", type: String })
  subtotal!: string;

  @ApiProperty({ example: "50000", type: String })
  discountAmount!: string;

  @ApiProperty({ example: "0", type: String })
  shippingFee!: string;

  @ApiProperty({ example: "650000", type: String })
  totalAmount!: string;

  @ApiProperty({ type: [OrderLineResponseDto] })
  items!: OrderLineResponseDto[];
}

export class AdminShippingEventResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "tracking", type: String })
  eventType!: string;

  @ApiPropertyOptional({ example: "2001", nullable: true, type: String })
  statusCode!: string | null;

  @ApiPropertyOptional({ example: "2026-08-20T09:00:00.000Z", nullable: true, type: String })
  occurredAt!: Date | null;

  @ApiProperty({ example: "2026-08-20T09:00:03.000Z", type: String })
  receivedAt!: Date;
}

export class AdminShippingShipmentResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "spx", type: String })
  provider!: string;

  @ApiPropertyOptional({ example: "SPXVN04191983057C", nullable: true, type: String })
  trackingNo!: string | null;

  @ApiPropertyOptional({ example: "https://spx.vn/track?SPXVN04191983057C", nullable: true, type: String })
  trackingLink!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  batchNo!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  consignmentNo!: string | null;

  @ApiPropertyOptional({ example: "2001", nullable: true, type: String })
  statusCode!: string | null;

  @ApiPropertyOptional({ example: "In Transit", nullable: true, type: String })
  status!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  awbLink!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  awbExpiresAt!: Date | null;

  @ApiPropertyOptional({ example: "30000", nullable: true, type: String })
  estimatedShippingFee!: string | null;

  @ApiPropertyOptional({ example: "32000", nullable: true, type: String })
  actualShippingFee!: string | null;

  @ApiPropertyOptional({ example: "0.500", nullable: true, type: String })
  chargeableWeight!: string | null;

  @ApiProperty({ example: "2026-08-20T09:00:00.000Z", type: String })
  updatedAt!: Date;

  @ApiProperty({ type: [AdminShippingEventResponseDto] })
  events!: AdminShippingEventResponseDto[];
}

export class AdminOrderResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "DH202607210001", type: String })
  orderCode!: string;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  createdAt!: Date;

  @ApiProperty({ example: "2026-07-21T09:05:00.000Z", format: "date-time", type: String })
  updatedAt!: Date;

  @ApiProperty({ example: "Nguyen Van A", type: String })
  recipientName!: string;

  @ApiProperty({ example: "0912345678", type: String })
  recipientPhone!: string;

  @ApiProperty({ example: "123 Nguyen Hue", type: String })
  address!: string;

  @ApiProperty({ example: "Ho Chi Minh", type: String })
  province!: string;

  @ApiProperty({ example: "Quan 1", type: String })
  district!: string;

  @ApiProperty({ example: "Phuong Ben Nghe", type: String })
  ward!: string;

  @ApiProperty({ example: "700000", type: String })
  subtotal!: string;

  @ApiProperty({ example: "50000", type: String })
  discountAmount!: string;

  @ApiProperty({ example: "0", type: String })
  shippingFee!: string;

  @ApiProperty({ example: "650000", type: String })
  totalAmount!: string;

  @ApiProperty({ example: true, type: Boolean })
  isPromotionApplied!: boolean;

  @ApiProperty({ example: "pending", type: String })
  orderStatus!: string;

  @ApiProperty({ example: "unpaid", type: String })
  paymentStatus!: string;

  @ApiProperty({ example: "pending", type: String })
  syncStatus!: string;

  @ApiPropertyOptional({ example: "Giao hang gio hanh chinh", nullable: true, type: String })
  note!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  pancakeOrderId!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  shippingOrderId!: string | null;

  @ApiProperty({ type: [AdminShippingShipmentResponseDto] })
  shipments!: AdminShippingShipmentResponseDto[];

  @ApiProperty({ type: [OrderLineResponseDto] })
  items!: OrderLineResponseDto[];
}
