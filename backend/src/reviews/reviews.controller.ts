import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';

@ApiTags('reviews')
@Controller('api/v1/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  /** Customer submits a review for a completed order */
  @Post()
  @ApiBearerAuth()
  @Roles('customer')
  create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.sub, dto);
  }

  /** Public: all reviews for a service */
  @Get('service/:serviceId')
  @Public()
  forService(@Param('serviceId') serviceId: string) {
    return this.reviewsService.forService(serviceId);
  }

  /** Public: all reviews for a freelancer */
  @Get('freelancer/:freelancerId')
  @Public()
  forFreelancer(@Param('freelancerId') freelancerId: string) {
    return this.reviewsService.forFreelancer(freelancerId);
  }

  /** Check if current user already reviewed an order */
  @Get('order/:orderId')
  @ApiBearerAuth()
  forOrder(@Param('orderId') orderId: string) {
    return this.reviewsService.forOrder(orderId);
  }
}
