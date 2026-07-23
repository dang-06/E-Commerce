import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AuditLogResponseDto {
  @ApiProperty({ example: "1", type: String })
  id!: string;

  @ApiPropertyOptional({ example: "1", nullable: true, type: String })
  adminId!: string | null;

  @ApiProperty({ example: "Admin User", type: String })
  adminName!: string;

  @ApiProperty({ example: "product.create", type: String })
  action!: string;

  @ApiProperty({ example: "product", type: String })
  entityType!: string;

  @ApiPropertyOptional({ example: "1", nullable: true, type: String })
  entityId!: string | null;

  @ApiProperty({ example: { changedFields: ["name", "listedPrice"] }, type: Object })
  metadata!: unknown;

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  createdAt!: Date;
}
