import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../auth.service.js";
import type { AuthenticatedRequest } from "../auth.types.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & AuthenticatedRequest>();
    const authorization = request.header("authorization");
    const token = this.extractBearerToken(authorization);
    request.admin = await this.auth.getAuthenticatedAdmin(token);
    return true;
  }

  private extractBearerToken(authorization: string | undefined): string {
    if (!authorization) {
      throw new UnauthorizedException("Missing access token");
    }

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Missing access token");
    }

    return token;
  }
}
