import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { REQUEST_ID_HEADER, type RequestWithId } from "../middleware/request-id.middleware.js";
import type { JsonLogger } from "../logging/json-logger.service.js";

interface ErrorResponseBody {
  error: {
    message: string | string[];
    statusCode: number;
    timestamp: string;
    path: string;
    requestId?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: JsonLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const requestWithId = request as RequestWithId;
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = this.resolveMessage(exceptionResponse, exception);
    const requestId = requestWithId.requestId ?? request.header(REQUEST_ID_HEADER);

    this.logger.error(
      message,
      exception instanceof Error ? exception.stack : undefined,
      "ExceptionFilter",
    );

    const body: ErrorResponseBody = {
      error: {
        message,
        statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(requestId ? { requestId } : {}),
      },
    };

    response.status(statusCode).json(body);
  }

  private resolveMessage(response: unknown, exception: unknown): string | string[] {
    if (typeof response === "object" && response !== null && "message" in response) {
      const { message } = response;
      if (typeof message === "string") {
        return message;
      }

      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message;
      }
    }

    if (typeof response === "string") {
      return response;
    }

    if (exception instanceof Error && exception.message.length > 0) {
      return exception.message;
    }

    return "Internal server error";
  }
}
