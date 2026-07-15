import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { AccessTokenService } from "./token.service.js";
import { LoginRateLimiterService } from "./login-rate-limiter.service.js";
import { ADMIN_REPOSITORY, type AdminRepository } from "./repositories/admin.repository.js";
import type { SafeAdmin } from "./auth.types.js";

export interface LoginResult {
  accessToken: string;
  admin: SafeAdmin;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly admins: AdminRepository,
    private readonly tokens: AccessTokenService,
    private readonly loginRateLimiter: LoginRateLimiterService,
  ) {}

  async login(email: string, password: string, rateLimitKey: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    this.loginRateLimiter.assertAllowed(`${normalizedEmail}:${rateLimitKey}`);

    const admin = await this.admins.findByEmail(normalizedEmail);
    if (!admin) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (admin.status !== "active") {
      throw new UnauthorizedException("Admin account is locked");
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    this.loginRateLimiter.reset(`${normalizedEmail}:${rateLimitKey}`);
    await this.admins.updateLastLoginAt(admin.id, new Date());
    const safeAdmin = this.toSafeAdmin(admin);

    return {
      accessToken: this.tokens.sign(safeAdmin),
      admin: safeAdmin,
    };
  }

  async getAuthenticatedAdmin(token: string): Promise<SafeAdmin> {
    const payload = this.tokens.verify(token);
    const admin = await this.admins.findById(payload.sub);
    if (admin?.status !== "active") {
      throw new UnauthorizedException("Invalid access token");
    }

    return this.toSafeAdmin(admin);
  }

  private toSafeAdmin(admin: SafeAdmin): SafeAdmin {
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
