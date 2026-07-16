import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { CreateOrderDto, QuoteOrderDto, UpdateOrderStatusDto } from "./dto/order.dto.js";
import {
  OrdersService,
  type AdminOrderResponse,
  type CreateOrderResponse,
  type OrderQuoteResponse,
} from "./orders.service.js";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post("quote")
  quote(@Body() dto: QuoteOrderDto): Promise<OrderQuoteResponse> {
    return this.orders.quote(dto);
  }

  @Post()
  create(@Body() dto: CreateOrderDto): Promise<CreateOrderResponse> {
    return this.orders.create(dto);
  }
}

@ApiTags("admin orders")
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @Roles("operator", "admin")
  list(@Query("limit") limit?: string): Promise<AdminOrderResponse[]> {
    const parsedLimit = Number(limit ?? 100);
    return this.orders.listAdmin(Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 100);
  }

  @Get(":id")
  @Roles("operator", "admin")
  get(@Param("id") id: string): Promise<AdminOrderResponse> {
    return this.orders.getAdmin(id);
  }

  @Patch(":id/status")
  @Roles("operator", "admin")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto): Promise<AdminOrderResponse> {
    return this.orders.updateStatus(id, dto.status);
  }
}
