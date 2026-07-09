import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase.module';
import { AuthModule } from './auth/auth.module';
import { FreelancersModule } from './freelancers/freelancers.module';
import { AdminModule } from './admin/admin.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { ServicesModule } from './services/services.module';
import { OrdersModule } from './orders/orders.module';
import { DisputesModule } from './disputes/disputes.module';
import { ReviewsModule } from './reviews/reviews.module';
import { EmailModule } from './email/email.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60_000, limit: 120 }]),
    SupabaseModule,
    AuthModule,
    FreelancersModule,
    AdminModule,
    RazorpayModule,
    ServicesModule,
    OrdersModule,
    DisputesModule,
    ReviewsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Rate limiting — 120 req/min globally; auth endpoints override to 10/min
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // JWT guard applied globally — use @Public() to opt out on public endpoints
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Roles guard applied globally — use @Roles('admin') etc. to restrict
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
