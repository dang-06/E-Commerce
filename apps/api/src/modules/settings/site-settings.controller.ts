import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { SiteSettingsResponseDto, UpdateSiteSettingsDto } from "./dto/site-settings.dto.js";
import { SiteSettingsService, type SiteSettingsResponse } from "./site-settings.service.js";

@ApiTags("site settings")
@Controller("site-settings")
export class PublicSiteSettingsController {
  constructor(private readonly settings: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: "Get public site banner settings" })
  @ApiOkResponse({ type: SiteSettingsResponseDto })
  get(): Promise<SiteSettingsResponse> {
    return this.settings.get();
  }
}

@ApiTags("admin site settings")
@ApiBearerAuth("bearer")
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/site-settings")
export class AdminSiteSettingsController {
  constructor(private readonly settings: SiteSettingsService) {}

  @Get()
  @Roles("operator", "admin")
  @ApiOperation({ summary: "Get editable site banner settings" })
  @ApiOkResponse({ type: SiteSettingsResponseDto })
  get(): Promise<SiteSettingsResponse> {
    return this.settings.get();
  }

  @Put()
  @Roles("admin")
  @ApiOperation({ summary: "Update homepage banner image and text" })
  @ApiOkResponse({ type: SiteSettingsResponseDto })
  update(@Body() dto: UpdateSiteSettingsDto): Promise<SiteSettingsResponse> {
    return this.settings.update(dto);
  }
}
