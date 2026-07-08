import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase.module';
import { AuthModule } from './auth/auth.module';
import { FreelancersModule } from './freelancers/freelancers.module';
import { AdminModule } from './admin/admin.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    FreelancersModule,
    AdminModule,
    RazorpayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // JWT guard applied globally — use @Public() to opt out on public endpoints
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Roles guard applied globally — use @Roles('admin') etc. to restrict
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
