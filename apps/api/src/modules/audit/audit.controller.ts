import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../database/prisma.service.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { AuditLogResponseDto } from "./dto/audit-response.dto.js";

interface AuditLogResponse {
  id: string;
  adminId: string | null;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
}

@ApiTags("admin audit logs")
@ApiBearerAuth("bearer")
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/audit-logs")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles("admin")
  @ApiOkResponse({ type: [AuditLogResponseDto] })
  async list(): Promise<AuditLogResponse[]> {
    const logs = await this.prisma.auditLog.findMany({
      include: { admin: { select: { fullName: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 100,
    });
    return logs.map((log) => ({
      id: log.id.toString(),
      adminId: log.adminId?.toString() ?? null,
      adminName: log.admin?.fullName ?? "System",
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));
  }
}
