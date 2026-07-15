import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateOrderDto, QuoteOrderDto } from "./dto/order.dto.js";
import { OrdersService, type CreateOrderResponse, type OrderQuoteResponse } from "./orders.service.js";

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
