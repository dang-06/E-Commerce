import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import {
  CheckPromotionDto,
  CreateEligibleCustomerDto,
  ImportEligibleCustomersDto,
  ListEligibleCustomersQueryDto,
  SetEligibleCustomerStatusDto,
} from "./dto/promotion.dto.js";
import {
  EligibleCustomerResponseDto,
  ImportEligibleCustomersResultDto,
  PromotionCheckResponseDto,
} from "./dto/promotion-response.dto.js";
import {
  PromotionsService,
  type EligibleCustomerResponse,
  type ImportEligibleCustomersResult,
  type PromotionCheckResponse,
} from "./promotions.service.js";

const importFileMaxSizeBytes = 5 * 1024 * 1024;
const importFileExtensions = /\.(csv|tsv|txt|xls|xlsx)$/i;
const importFileMimeTypes = new Set([
  "",
  "text/csv",
  "text/plain",
  "text/tab-separated-values",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

@ApiTags("promotions")
@Controller("promotions")
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Post("check")
  @ApiCreatedResponse({ type: PromotionCheckResponseDto })
  check(@Body() dto: CheckPromotionDto, @Req() request: Request): Promise<PromotionCheckResponse> {
    return this.promotions.check(dto.phone, request.ip ?? "unknown", request.header("user-agent"));
  }
}

@ApiTags("admin eligible customers")
@ApiBearerAuth("bearer")
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/eligible-customers")
export class AdminEligibleCustomersController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @Roles("operator", "admin")
  @ApiQuery({ name: "isActive", required: false, example: true })
  @ApiQuery({ name: "source", required: false, enum: ["sheet", "pancake", "best", "import", "manual"] })
  @ApiQuery({ name: "limit", required: false, example: 50, description: "Max 100." })
  @ApiOkResponse({ type: [EligibleCustomerResponseDto] })
  list(@Query() query: ListEligibleCustomersQueryDto): Promise<EligibleCustomerResponse[]> {
    return this.promotions.listEligibleCustomers(query);
  }

  @Post()
  @Roles("admin")
  @ApiCreatedResponse({ type: EligibleCustomerResponseDto })
  create(@Body() dto: CreateEligibleCustomerDto): Promise<EligibleCustomerResponse> {
    return this.promotions.createEligibleCustomer(dto);
  }

  @Post("import")
  @Roles("admin")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: importFileMaxSizeBytes },
      fileFilter: (_request, file, callback) => {
        const isAllowedExtension = importFileExtensions.test(file.originalname);
        const isAllowedMimeType = importFileMimeTypes.has(file.mimetype);
        if (!isAllowedExtension && !isAllowedMimeType) {
          callback(
            new BadRequestException("Only CSV, TSV, TXT, XLS, or XLSX files are supported"),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file", "source"],
      properties: {
        file: { type: "string", format: "binary" },
        source: { type: "string", enum: ["sheet", "pancake", "best", "import", "manual"] },
        eligibilityReason: {
          type: "string",
          enum: ["delivered", "purchased", "manual", "imported"],
        },
        sourceCustomerId: { type: "string" },
      },
    },
  })
  @ApiCreatedResponse({ type: ImportEligibleCustomersResultDto })
  import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: ImportEligibleCustomersDto,
  ): Promise<ImportEligibleCustomersResult> {
    return this.promotions.importEligibleCustomers(file, dto);
  }

  @Patch(":id/status")
  @Roles("admin")
  @ApiParam({ name: "id", example: "1" })
  @ApiOkResponse({ type: EligibleCustomerResponseDto })
  setStatus(
    @Param("id") id: string,
    @Body() dto: SetEligibleCustomerStatusDto,
  ): Promise<EligibleCustomerResponse> {
    return this.promotions.setEligibleCustomerStatus(id, dto.isActive);
  }
}
