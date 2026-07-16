import { Body, Controller, Get, NotFoundException, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { UpsertGoogleSheetConfigDto } from "./dto/google-sheet-config.dto.js";
import {
  GoogleSheetConfigService,
  type GoogleSheetConfigResponse,
  type GoogleSheetConfigsResponse,
} from "./google-sheet-config.service.js";
import { PrismaIntegrationJobStore } from "./repositories/prisma-integration-job.store.js";
import type { IntegrationJobListItem } from "./integration.types.js";

@ApiTags("admin integrations")
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/integrations")
export class IntegrationsController {
  constructor(
    private readonly store: PrismaIntegrationJobStore,
    private readonly googleSheetConfigs: GoogleSheetConfigService,
  ) {}

  @Get()
  @Roles("operator", "admin")
  list(@Query("limit") limit?: string): Promise<IntegrationJobListItem[]> {
    const parsedLimit = Number(limit ?? 50);
    return this.store.list(Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50);
  }

  @Get("google-sheets")
  @Roles("operator", "admin")
  listGoogleSheetConfigs(): Promise<GoogleSheetConfigsResponse> {
    return this.googleSheetConfigs.list();
  }

  @Put("google-sheets/:purpose")
  @Roles("admin")
  upsertGoogleSheetConfig(
    @Param("purpose") purpose: string,
    @Body() dto: UpsertGoogleSheetConfigDto,
  ): Promise<GoogleSheetConfigResponse> {
    return this.googleSheetConfigs.upsert(purpose, dto);
  }

  @Post(":id/retry")
  @Roles("operator", "admin")
  async retry(@Param("id") id: string): Promise<IntegrationJobListItem> {
    const existing = await this.store.getById(id);
    if (!existing) {
      throw new NotFoundException("Integration job not found");
    }
    return this.store.retryNow(id);
  }
}
