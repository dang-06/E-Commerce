import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class HealthStatusResponseDto {
  @ApiProperty({ enum: ["ok", "error"], example: "ok", type: String })
  status!: "ok" | "error";

  @ApiProperty({ example: "2026-07-21T09:00:00.000Z", format: "date-time", type: String })
  timestamp!: string;

  @ApiPropertyOptional({ example: "req_01HY...", type: String })
  requestId?: string;
}
