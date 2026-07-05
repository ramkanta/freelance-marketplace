import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase.module';
import { AuthModule } from './auth/auth.module';
import { FreelancersModule } from './freelancers/freelancers.module';
import { AdminModule } from './admin/admin.module';
import { RazorpayModule } from './razorpay/razorpay.module';

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    AuthModule,
    FreelancersModule,
    AdminModule,
    RazorpayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
