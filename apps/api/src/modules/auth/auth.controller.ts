import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";
import { AuthService, type LoginResult } from "./auth.service.js";
import { LoginResponseDto, SafeAdminResponseDto } from "./dto/auth-response.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { AuthGuard } from "./guards/auth.guard.js";
import { CurrentAdmin } from "./decorators/current-admin.decorator.js";
import type { SafeAdmin } from "./auth.types.js";

@ApiTags("admin auth")
@Controller("admin/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @ApiOperation({
    description: "Returns a JWT accessToken. Copy it into the Swagger Authorize dialog as the bearer token.",
    summary: "Admin login",
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: "Returns an access token and the current admin profile.",
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: "Invalid request body." })
  @ApiUnauthorizedResponse({ description: "Invalid email/password or locked admin account." })
  @ApiTooManyRequestsResponse({ description: "Too many login attempts." })
  async login(@Body() dto: LoginDto, @Req() request: Request): Promise<LoginResult> {
    const rateLimitKey = request.ip ?? "unknown";
    return this.auth.login(dto.email, dto.password, rateLimitKey);
  }

  @Get("me")
  @ApiBearerAuth("bearer")
  @ApiOperation({ summary: "Get current admin profile" })
  @UseGuards(AuthGuard)
  @ApiOkResponse({ description: "Returns the authenticated admin profile.", type: SafeAdminResponseDto })
  me(@CurrentAdmin() admin: SafeAdmin): SafeAdmin {
    return admin;
  }
}
