import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController, WebhooksController } from './orders.controller';
import { DisputesModule } from '../disputes/disputes.module';

@Module({
  imports: [forwardRef(() => DisputesModule)],
  controllers: [OrdersController, WebhooksController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
