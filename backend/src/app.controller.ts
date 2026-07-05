import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { AppService } from './app.service';

export class CreateTestDto {
  @ApiProperty({
    description: 'The test message to store in the database',
    example: 'Connection test successful!',
  })
  message: string;

  @ApiProperty({
    description: 'The status of the test connection',
    example: 'active',
    required: false,
  })
  status?: string;

  @ApiProperty({
    description: 'Additional custom json metadata for testing payload types',
    example: { environment: 'development', engine: 'typeorm' },
    required: false,
  })
  payload?: Record<string, any>;

  @ApiProperty({
    description: 'The IP address from where the test request originated',
    example: '192.168.1.1',
    required: false,
  })
  ipAddress?: string;
}

export class BulkCreateTestDto {
  @ApiProperty({
    description: 'Array of messages to insert in bulk',
    example: ['Bulk message 1', 'Bulk message 2', 'Bulk message 3'],
  })
  messages: string[];
}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'The new status to update the entry to',
    example: 'completed',
  })
  status: string;
}

@ApiTags('Test Connection')
@Controller('test-connection')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all test connection entries from the database' })
  async getTests(): Promise<any[]> {
    return this.appService.getTests();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new test connection entry in the database' })
  async createTest(@Body() body: CreateTestDto): Promise<any> {
    return this.appService.createTest(body.message, body.status, body.payload, body.ipAddress);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple test connection entries in a single request' })
  async createBulk(@Body() body: BulkCreateTestDto): Promise<any[]> {
    return this.appService.createBulkTests(body.messages);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update the status of an existing test connection entry' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStatusDto,
  ): Promise<any> {
    return this.appService.updateStatus(id, body.status);
  }
}
