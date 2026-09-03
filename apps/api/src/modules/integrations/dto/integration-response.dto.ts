import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class IntegrationJobListItemResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "DH202607210001", type: String })
  orderCode!: string;

  @ApiProperty({ enum: ["sheet", "pancake", "best", "spx"], example: "spx", type: String })
  integration!: string;

  @ApiProperty({ example: "create", type: String })
  action!: string;

  @ApiProperty({ example: "pending", type: String })
  status!: string;

  @ApiProperty({ example: 0, type: Number })
  attemptCount!: number;

  @ApiPropertyOptional({ example: null, format: "date-time", nullable: true, type: String })
  nextRetryAt!: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  externalId!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  lastError!: string | null;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  createdAt!: Date;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  updatedAt!: Date;
}

export class GoogleSheetConfigResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ enum: ["eligible_customers", "orders"], example: "eligible_customers", type: String })
  purpose!: "eligible_customers" | "orders";

  @ApiProperty({
    example: "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit",
    type: String,
  })
  sheetUrl!: string;

  @ApiProperty({ example: "1AbCdEfGhIjKlMnOpQrStUvWxYz", type: String })
  spreadsheetId!: string;

  @ApiPropertyOptional({ example: "Sheet1", nullable: true, type: String })
  worksheetName!: string | null;

  @ApiPropertyOptional({ example: "phone", nullable: true, type: String })
  phoneColumn!: string | null;

  @ApiPropertyOptional({ example: { recipientName: "customer_name" }, nullable: true, type: Object })
  orderMapping!: Record<string, unknown> | null;

  @ApiProperty({ example: true, type: Boolean })
  isActive!: boolean;

  @ApiPropertyOptional({ example: null, format: "date-time", nullable: true, type: String })
  lastSyncAt!: string | null;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  createdAt!: string;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  updatedAt!: string;
}

export class GoogleSheetConfigsResponseDto {
  @ApiPropertyOptional({ type: GoogleSheetConfigResponseDto, nullable: true })
  eligibleCustomers!: GoogleSheetConfigResponseDto | null;

  @ApiPropertyOptional({ type: GoogleSheetConfigResponseDto, nullable: true })
  orders!: GoogleSheetConfigResponseDto | null;
}

export class SpxAccountResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "0901234567", type: String })
  phone!: string;

  @ApiPropertyOptional({ example: "shop@example.com", nullable: true, type: String })
  email!: string | null;

  @ApiProperty({ example: "110592440436149", type: String })
  userId!: string;

  @ApiProperty({ example: true, type: Boolean })
  isActive!: boolean;

  @ApiPropertyOptional({ example: "2026-08-25T09:00:00.000Z", nullable: true, type: String })
  verifiedAt!: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  lastError!: string | null;

  @ApiProperty({ example: "2026-08-25T09:00:00.000Z", type: String })
  createdAt!: Date;

  @ApiProperty({ example: "2026-08-25T09:00:00.000Z", type: String })
  updatedAt!: Date;
}

export class SpxShipmentListItemResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "1", type: String })
  orderId!: string;

  @ApiProperty({ example: "DH202608250001", type: String })
  orderCode!: string;

  @ApiProperty({ example: "Nguyen Van A", type: String })
  recipientName!: string;

  @ApiProperty({ example: "0901234567", type: String })
  recipientPhone!: string;

  @ApiPropertyOptional({ example: "SPXVN04191983057C", nullable: true, type: String })
  trackingNo!: string | null;

  @ApiPropertyOptional({ example: "https://spx.vn/track?SPXVN04191983057C", nullable: true, type: String })
  trackingLink!: string | null;

  @ApiPropertyOptional({ example: "1001", nullable: true, type: String })
  statusCode!: string | null;

  @ApiPropertyOptional({ example: "Pending Pickup", nullable: true, type: String })
  status!: string | null;

  @ApiPropertyOptional({ example: "https://test-stable.spx.vn/downloads/resource/shipping_label/sample.pdf", nullable: true, type: String })
  awbLink!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true, type: String })
  awbExpiresAt!: Date | null;

  @ApiPropertyOptional({ example: "30000", nullable: true, type: String })
  estimatedShippingFee!: string | null;

  @ApiPropertyOptional({ example: "32000", nullable: true, type: String })
  actualShippingFee!: string | null;

  @ApiProperty({ example: "2026-08-25T09:00:00.000Z", type: String })
  createdAt!: Date;

  @ApiProperty({ example: "2026-08-25T09:00:00.000Z", type: String })
  updatedAt!: Date;
}
