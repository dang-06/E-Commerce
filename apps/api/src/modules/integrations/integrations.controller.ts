import { Body, Controller, Get, Headers, NotFoundException, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { UpsertGoogleSheetConfigDto } from "./dto/google-sheet-config.dto.js";
import {
  GoogleSheetConfigResponseDto,
  GoogleSheetConfigsResponseDto,
  IntegrationJobListItemResponseDto,
  SpxAccountResponseDto,
  SpxShipmentListItemResponseDto,
} from "./dto/integration-response.dto.js";
import { CreateSpxAccountDto } from "./dto/spx-account.dto.js";
import {
  GoogleSheetConfigService,
  type GoogleSheetConfigResponse,
  type GoogleSheetConfigsResponse,
} from "./google-sheet-config.service.js";
import { PrismaIntegrationJobStore } from "./repositories/prisma-integration-job.store.js";
import { SpxAccountService, type SpxAccountResponse } from "./spx-account.service.js";
import { SpxShippingService, type SpxAwbResponse, type SpxShipmentListItem } from "./spx-shipping.service.js";
import type { IntegrationJobListItem } from "./integration.types.js";

@ApiTags("admin integrations")
@ApiBearerAuth("bearer")
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/integrations")
export class IntegrationsController {
  constructor(
    private readonly store: PrismaIntegrationJobStore,
    private readonly googleSheetConfigs: GoogleSheetConfigService,
    private readonly spxAccounts: SpxAccountService,
    private readonly spxShipping: SpxShippingService,
  ) {}

  @Get()
  @Roles("operator", "admin")
  @ApiQuery({ name: "limit", required: false, example: 50, description: "Max 100." })
  @ApiOkResponse({ type: [IntegrationJobListItemResponseDto] })
  list(@Query("limit") limit?: string): Promise<IntegrationJobListItem[]> {
    const parsedLimit = Number(limit ?? 50);
    return this.store.list(Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50);
  }

  @Get("google-sheets")
  @Roles("operator", "admin")
  @ApiOkResponse({ type: GoogleSheetConfigsResponseDto })
  listGoogleSheetConfigs(): Promise<GoogleSheetConfigsResponse> {
    return this.googleSheetConfigs.list();
  }

  @Put("google-sheets/:purpose")
  @Roles("admin")
  @ApiParam({ name: "purpose", enum: ["eligible_customers", "orders"] })
  @ApiOkResponse({ type: GoogleSheetConfigResponseDto })
  upsertGoogleSheetConfig(
    @Param("purpose") purpose: string,
    @Body() dto: UpsertGoogleSheetConfigDto,
  ): Promise<GoogleSheetConfigResponse> {
    return this.googleSheetConfigs.upsert(purpose, dto);
  }

  @Get("spx/accounts")
  @Roles("operator", "admin")
  @ApiOkResponse({ type: [SpxAccountResponseDto] })
  listSpxAccounts(): Promise<SpxAccountResponse[]> {
    return this.spxAccounts.list();
  }

  @Post("spx/accounts")
  @Roles("admin")
  @ApiCreatedResponse({ type: SpxAccountResponseDto })
  createSpxAccount(@Body() dto: CreateSpxAccountDto): Promise<SpxAccountResponse> {
    return this.spxAccounts.createFromSpx(dto);
  }

  @Post("spx/accounts/:id/verify")
  @Roles("operator", "admin")
  @ApiParam({ name: "id", example: "1" })
  @ApiCreatedResponse({ type: SpxAccountResponseDto })
  verifySpxAccount(@Param("id") id: string): Promise<SpxAccountResponse> {
    return this.spxAccounts.verify(id);
  }

  @Post("spx/accounts/:id/activate")
  @Roles("admin")
  @ApiParam({ name: "id", example: "1" })
  @ApiCreatedResponse({ type: SpxAccountResponseDto })
  activateSpxAccount(@Param("id") id: string): Promise<SpxAccountResponse> {
    return this.spxAccounts.activate(id);
  }

  @Get("spx/shipments")
  @Roles("operator", "admin")
  @ApiQuery({ name: "limit", required: false, example: 100, description: "Max 200." })
  @ApiOkResponse({ type: [SpxShipmentListItemResponseDto] })
  listSpxShipments(@Query("limit") limit?: string): Promise<SpxShipmentListItem[]> {
    const parsedLimit = Number(limit ?? 100);
    return this.spxShipping.listShipments(Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100);
  }

  @Post(":id/retry")
  @Roles("operator", "admin")
  @ApiParam({ name: "id", example: "1" })
  @ApiCreatedResponse({ type: IntegrationJobListItemResponseDto })
  async retry(@Param("id") id: string): Promise<IntegrationJobListItem> {
    const existing = await this.store.getById(id);
    if (!existing) {
      throw new NotFoundException("Integration job not found");
    }
    return this.store.retryNow(id);
  }

  @Post("spx/shipments/:id/awb")
  @Roles("operator", "admin")
  @ApiParam({ name: "id", example: "1" })
  @ApiCreatedResponse({ type: Object })
  getSpxAwb(@Param("id") id: string): Promise<SpxAwbResponse> {
    return this.spxShipping.getAwb(id);
  }
}

@ApiTags("spx webhooks")
@Controller("webhooks/spx")
export class SpxWebhooksController {
  constructor(private readonly spxShipping: SpxShippingService) {}

  @Post(":type")
  async receive(
    @Param("type") type: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
  ): Promise<{ received: true }> {
    await this.spxShipping.handleWebhook(type, headers, body);
    return { received: true };
  }
}
