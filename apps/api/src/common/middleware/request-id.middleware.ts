import { randomUUID } from "node:crypto";
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export const REQUEST_ID_HEADER = "x-request-id";

export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    const incomingRequestId = request.header(REQUEST_ID_HEADER);
    const requestId =
      incomingRequestId && incomingRequestId.length <= 128 ? incomingRequestId : randomUUID();

    (request as RequestWithId).requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      process.stdout.write(
        `${JSON.stringify({
          level: "log",
          context: "HttpRequest",
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          timestamp: new Date().toISOString(),
        })}\n`,
      );
    });

    next();
  }
}
