import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AuthService, type LoginResult } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { AuthGuard } from "./guards/auth.guard.js";
import { CurrentAdmin } from "./decorators/current-admin.decorator.js";
import type { SafeAdmin } from "./auth.types.js";

@ApiTags("admin auth")
@Controller("admin/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @ApiOkResponse({ description: "Returns an access token and the current admin profile." })
  async login(@Body() dto: LoginDto, @Req() request: Request): Promise<LoginResult> {
    const rateLimitKey = request.ip ?? "unknown";
    return this.auth.login(dto.email, dto.password, rateLimitKey);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: "Returns the authenticated admin profile." })
  me(@CurrentAdmin() admin: SafeAdmin): SafeAdmin {
    return admin;
  }
}
