import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [AdminController, UsersController],
  providers: [AdminService, UsersService],
  exports: [AdminService, UsersService],
})
export class AdminModule {}
