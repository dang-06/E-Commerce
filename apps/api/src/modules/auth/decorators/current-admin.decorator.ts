import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedRequest, SafeAdmin } from "../auth.types.js";

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SafeAdmin | undefined => {
    const request = context.switchToHttp().getRequest<Request & AuthenticatedRequest>();
    return request.admin;
  },
);
