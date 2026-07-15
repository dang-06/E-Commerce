import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AccessTokenService } from "./token.service.js";
import { LoginRateLimiterService } from "./login-rate-limiter.service.js";
import { ADMIN_REPOSITORY } from "./repositories/admin.repository.js";
import { PrismaAdminRepository } from "./repositories/prisma-admin.repository.js";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenService,
    LoginRateLimiterService,
    PrismaAdminRepository,
    {
      provide: ADMIN_REPOSITORY,
      useExisting: PrismaAdminRepository,
    },
  ],
  exports: [AuthService, AccessTokenService, LoginRateLimiterService, ADMIN_REPOSITORY],
})
export class AuthModule {}
