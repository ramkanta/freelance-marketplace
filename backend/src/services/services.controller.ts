import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('api/v1/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Roles('freelancer')
  @Post()
  @ApiOperation({ summary: 'Create a new service/gig listing (freelancer only)' })
  @ApiResponse({ status: 201, description: 'Service created successfully.' })
  async create(@Request() req, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user.sub, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse all active service listings with filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of services.' })
  async findAll(@Query() query: QueryServicesDto) {
    return this.servicesService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single service by ID' })
  @ApiResponse({ status: 200, description: 'Service detail with freelancer info.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Roles('freelancer')
  @Patch(':id')
  @ApiOperation({ summary: 'Update your own service listing (freelancer only)' })
  @ApiResponse({ status: 200, description: 'Service updated.' })
  async update(@Param('id') id: string, @Request() req, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, req.user.sub, dto);
  }

  @Roles('freelancer')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete your own service (freelancer only)' })
  @ApiResponse({ status: 200, description: 'Service removed.' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.servicesService.remove(id, req.user.sub);
  }

  @Public()
  @Get('by-freelancer/:freelancerProfileId')
  @ApiOperation({ summary: 'Get all services for a specific freelancer profile' })
  @ApiResponse({ status: 200, description: 'List of services by this freelancer.' })
  async findByFreelancer(@Param('freelancerProfileId') id: string) {
    return this.servicesService.findByFreelancer(id);
  }
}
