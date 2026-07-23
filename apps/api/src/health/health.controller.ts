import { Controller, Get, InternalServerErrorException, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import {
  REQUEST_ID_HEADER,
  type RequestWithId,
} from "../common/middleware/request-id.middleware.js";
import { DatabaseReadinessService } from "./database-readiness.service.js";
import { HealthStatusResponseDto } from "./dto/health-response.dto.js";

interface HealthStatus {
  status: "ok" | "error";
  timestamp: string;
  requestId?: string;
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly databaseReadiness: DatabaseReadinessService) {}

  @Get("live")
  @ApiOkResponse({ description: "API process is alive.", type: HealthStatusResponseDto })
  liveness(@Req() request: Request): HealthStatus {
    const requestId = this.getRequestId(request);

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    };
  }

  @Get("ready")
  @ApiOkResponse({ description: "API dependencies are ready.", type: HealthStatusResponseDto })
  async readiness(@Req() request: Request): Promise<HealthStatus> {
    const isDatabaseReady = await this.databaseReadiness.isReady();
    if (!isDatabaseReady) {
      throw new InternalServerErrorException("Database is not ready");
    }
    const requestId = this.getRequestId(request);

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    };
  }

  private getRequestId(request: Request): string | undefined {
    return (request as RequestWithId).requestId ?? request.header(REQUEST_ID_HEADER);
  }
}
