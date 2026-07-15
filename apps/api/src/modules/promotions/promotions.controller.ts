import {
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import {
  CheckPromotionDto,
  ImportEligibleCustomersDto,
  ListEligibleCustomersQueryDto,
  SetEligibleCustomerStatusDto,
} from "./dto/promotion.dto.js";
import {
  PromotionsService,
  type EligibleCustomerResponse,
  type ImportEligibleCustomersResult,
  type PromotionCheckResponse,
} from "./promotions.service.js";

@ApiTags("promotions")
@Controller("promotions")
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Post("check")
  check(@Body() dto: CheckPromotionDto, @Req() request: Request): Promise<PromotionCheckResponse> {
    return this.promotions.check(dto.phone, request.ip ?? "unknown", request.header("user-agent"));
  }
}

@ApiTags("admin eligible customers")
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/eligible-customers")
export class AdminEligibleCustomersController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @Roles("operator", "admin")
  list(@Query() query: ListEligibleCustomersQueryDto): Promise<EligibleCustomerResponse[]> {
    return this.promotions.listEligibleCustomers(query);
  }

  @Post("import")
  @Roles("admin")
  @UseInterceptors(FileInterceptor("file"))
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
  import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: ImportEligibleCustomersDto,
  ): Promise<ImportEligibleCustomersResult> {
    return this.promotions.importEligibleCustomers(file, dto);
  }

  @Patch(":id/status")
  @Roles("admin")
  setStatus(
    @Param("id") id: string,
    @Body() dto: SetEligibleCustomerStatusDto,
  ): Promise<EligibleCustomerResponse> {
    return this.promotions.setEligibleCustomerStatus(id, dto.isActive);
  }
}

