import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PromotionCheckResponseDto {
  @ApiProperty({ example: true, type: Boolean })
  eligible!: boolean;

  @ApiPropertyOptional({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", type: String })
  promotionToken?: string;

  @ApiPropertyOptional({ example: "2026-07-21T09:30:00.000Z", format: "date-time", type: String })
  expiresAt?: Date;
}

export class EligibleCustomerResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiProperty({ example: "091****678", type: String })
  phoneMasked!: string;

  @ApiProperty({ example: "sha256:...", type: String })
  phoneHash!: string;

  @ApiProperty({ example: "import", type: String })
  source!: string;

  @ApiPropertyOptional({ example: "CRM-1001", nullable: true, type: String })
  sourceCustomerId!: string | null;

  @ApiProperty({ example: "imported", type: String })
  eligibilityReason!: string;

  @ApiPropertyOptional({ example: null, format: "date-time", nullable: true, type: String })
  successfulOrderAt!: Date | null;

  @ApiProperty({ example: 0, type: Number })
  usageCount!: number;

  @ApiPropertyOptional({ example: 1, nullable: true, type: Number })
  usageLimit!: number | null;

  @ApiProperty({ example: true, type: Boolean })
  isActive!: boolean;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  importedAt!: Date;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  createdAt!: Date;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  updatedAt!: Date;
}

export class ImportEligibleCustomersResultDto {
  @ApiProperty({ example: 120, type: Number })
  success!: number;

  @ApiProperty({ example: 5, type: Number })
  updated!: number;

  @ApiProperty({ example: 2, type: Number })
  invalid!: number;

  @ApiProperty({ example: 3, type: Number })
  duplicate!: number;
}
