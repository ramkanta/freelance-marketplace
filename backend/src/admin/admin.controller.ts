import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Admin / Database Migrations')
@ApiBearerAuth()
@Roles('admin')
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

  @Post('run-single')
  @ApiOperation({ summary: 'Execute a single SQL migration file against Supabase' })
  @ApiResponse({ status: 200, description: 'Returns execution log.' })
  async runSingleMigration(@Body('name') name: string) {
    return this.adminService.runSingleMigration(name);
  }
}
