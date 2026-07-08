import { Controller, Get, Post, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { AssignDisputeDto } from './dto/assign-dispute.dto';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Disputes')
@ApiBearerAuth()
@Controller('api/v1/disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  // Admin + Support: list disputes
  @Get()
  @Roles('admin', 'support')
  @ApiOperation({ summary: 'List disputes — admin sees all, support sees own assigned cases' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by dispute status' })
  async list(@Request() req, @Query('status') status?: string) {
    return this.disputesService.listDisputes(req.user.role, req.user.sub, status);
  }

  // Admin + Support: single dispute detail
  @Get(':id')
  @Roles('admin', 'support')
  @ApiOperation({ summary: 'Get dispute detail with order and ledger info' })
  @ApiResponse({ status: 404, description: 'Dispute not found.' })
  async getOne(@Param('id') id: string, @Request() req) {
    return this.disputesService.getDispute(id, req.user.role, req.user.sub);
  }

  // Admin only: assign dispute to a support agent
  @Post(':id/assign')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign dispute to a support agent (admin only)' })
  async assign(@Param('id') id: string, @Body() dto: AssignDisputeDto) {
    return this.disputesService.assignDispute(id, dto);
  }

  // Admin + Support: resolve dispute — triggers ledger entries
  @Post(':id/resolve')
  @Roles('admin', 'support')
  @ApiOperation({ summary: 'Resolve dispute: full refund, full release, or partial split' })
  async resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Request() req) {
    return this.disputesService.resolveDispute(id, dto, req.user.sub);
  }

  // Support: escalate to admin queue
  @Post(':id/escalate')
  @Roles('support')
  @ApiOperation({ summary: 'Escalate dispute to admin review queue (support only)' })
  async escalate(@Param('id') id: string, @Request() req) {
    return this.disputesService.escalateDispute(id, req.user.sub);
  }

  // Customer: get pre-signed upload URL for evidence
  @Post(':id/upload-url')
  @Roles('customer')
  @ApiOperation({ summary: 'Get Supabase Storage pre-signed URL to upload evidence (customer only)' })
  async uploadUrl(
    @Param('id') id: string,
    @Request() req,
    @Body('fileName') fileName: string,
  ) {
    return this.disputesService.getUploadUrl(id, req.user.sub, fileName);
  }

  // Customer: record evidence URL after upload completes
  @Post(':id/evidence')
  @Roles('customer')
  @ApiOperation({ summary: 'Append an uploaded evidence file URL to the dispute record' })
  async addEvidence(
    @Param('id') id: string,
    @Request() req,
    @Body('url') url: string,
  ) {
    return this.disputesService.addEvidenceUrl(id, req.user.sub, url);
  }
}
