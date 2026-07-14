import { Controller, Get, Post, Param, Body, Request, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { DisputeOrderDto } from './dto/dispute-order.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('customer')
  @ApiOperation({ summary: 'Create a new order (customer only) — returns Razorpay checkout config' })
  @ApiResponse({ status: 201, description: 'Order created with Razorpay order config.' })
  async create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all orders for the authenticated user (customer or freelancer)' })
  async list(@Request() req) {
    return this.ordersService.listOrders(req.user.sub, req.user.role);
  }

  @Get('wallet/balance')
  @Roles('customer')
  @ApiOperation({ summary: 'Get derived wallet balance from ledger (customer only)' })
  async walletBalance(@Request() req) {
    const balance = await this.ordersService.getWalletBalance(req.user.sub);
    return { balance };
  }

  @Post('wallet/topup-order')
  @Roles('customer')
  @ApiOperation({ summary: 'Create a Razorpay order for wallet top-up — returns checkout config' })
  async createTopupOrder(@Request() req, @Body('amount') amount: number) {
    return this.ordersService.createWalletTopupOrder(req.user.sub, amount);
  }

  @Post('wallet/verify-topup')
  @Roles('customer')
  @ApiOperation({ summary: 'Verify Razorpay payment signature and credit wallet' })
  async verifyTopup(
    @Request() req,
    @Body('razorpayOrderId') razorpayOrderId: string,
    @Body('razorpayPaymentId') razorpayPaymentId: string,
    @Body('razorpaySignature') razorpaySignature: string,
  ) {
    return this.ordersService.verifyWalletTopup(
      req.user.sub,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail with ledger entries' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async getOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.getOrder(id, req.user.sub);
  }

  @Post(':id/cancel')
  @Roles('customer')
  @ApiOperation({ summary: 'Customer cancels an order still awaiting payment' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.sub);
  }

  @Post(':id/wallet-checkout')
  @Roles('customer')
  @ApiOperation({ summary: 'Pay for an order using wallet balance (deducts from ledger)' })
  async walletCheckout(@Param('id') id: string, @Request() req) {
    return this.ordersService.walletCheckout(id, req.user.sub);
  }

  @Post(':id/mark-delivered')
  @Roles('freelancer')
  @ApiOperation({ summary: 'Freelancer marks the order as delivered' })
  async markDelivered(@Param('id') id: string, @Request() req) {
    return this.ordersService.markDelivered(id, req.user.sub);
  }

  @Post(':id/confirm')
  @Roles('customer')
  @ApiOperation({ summary: 'Customer confirms delivery — releases escrow to freelancer' })
  async confirm(@Param('id') id: string, @Request() req) {
    return this.ordersService.confirmDelivery(id, req.user.sub);
  }

  @Post(':id/dispute')
  @Roles('customer')
  @ApiOperation({ summary: 'Customer files a dispute — freezes escrow pending mediation' })
  async dispute(@Param('id') id: string, @Request() req, @Body() dto: DisputeOrderDto) {
    return this.ordersService.fileDispute(id, req.user.sub, dto);
  }
}

// Webhook is a separate controller — no JWT auth, uses HMAC signature instead
@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post('razorpay')
  @ApiOperation({ summary: 'Razorpay payment webhook — verified via HMAC-SHA256 signature' })
  async razorpayWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: any,
  ) {
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(body);
    return this.ordersService.handleRazorpayWebhook(body, signature, rawBody);
  }
}
