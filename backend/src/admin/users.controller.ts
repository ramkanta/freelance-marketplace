import { Controller, Get, Patch, Param, Query, Req, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import type { UserRole, UserStatus } from './users.service';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Admin / Users')
@ApiBearerAuth()
@Roles('admin')
@Controller('api/v1/admin/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('stats')
  stats() {
    return this.usersService.getPlatformStats();
  }

  @Get()
  list(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.listUsers({
      role, status, query,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':userId')
  getOne(@Param('userId') userId: string) {
    return this.usersService.getUser(userId);
  }

  @Patch(':userId/ban')
  ban(@Param('userId') userId: string, @Req() req: any) {
    return this.usersService.banUser(userId, req.user.sub);
  }

  @Patch(':userId/unban')
  unban(@Param('userId') userId: string) {
    return this.usersService.unbanUser(userId);
  }

  @Patch(':userId/role')
  changeRole(
    @Param('userId') userId: string,
    @Body('role') role: UserRole,
    @Req() req: any,
  ) {
    return this.usersService.changeRole(userId, role, req.user.sub);
  }
}
