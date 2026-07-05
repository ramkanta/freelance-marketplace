import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Admin / Database Migrations')
@Controller('api/v1/admin/migrations')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all SQL migration files in backend' })
  @ApiResponse({ status: 200, description: 'Returns a list of migrations.' })
  async getMigrations() {
    return this.adminService.getMigrationsList();
  }

  @Post('run')
  @ApiOperation({ summary: 'Execute all pending SQL migrations against Supabase' })
  @ApiResponse({ status: 200, description: 'Returns execution log.' })
  async runMigrations() {
    return this.adminService.runMigrations();
  }
}
