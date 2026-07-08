import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private supabase: SupabaseService) {}

  async create(customerId: string, dto: CreateReviewDto) {
    const db = this.supabase.getAdminClient();

    // Order must exist, be completed/payout_released, and belong to this customer
    const { data: order, error: orderErr } = await db
      .from('orders')
      .select('id, service_id, freelancer_id, customer_id, status')
      .eq('id', dto.orderId)
      .single();

    if (orderErr || !order) throw new NotFoundException('Order not found.');
    if (order.customer_id !== customerId)
      throw new ForbiddenException('You can only review your own orders.');
    if (!['completed', 'payout_released'].includes(order.status))
      throw new BadRequestException('You can only review a completed order.');

    // One review per order
    const { data: existing } = await db
      .from('reviews')
      .select('id')
      .eq('order_id', dto.orderId)
      .maybeSingle();

    if (existing) throw new BadRequestException('You have already reviewed this order.');

    const { data: review, error } = await db
      .from('reviews')
      .insert({
        order_id: dto.orderId,
        service_id: order.service_id,
        freelancer_id: order.freelancer_id,
        customer_id: customerId,
        rating: dto.rating,
        comment: dto.comment ?? null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { review };
  }

  async forService(serviceId: string) {
    const { data, error } = await this.supabase.getAdminClient()
      .from('reviews')
      .select('id, rating, comment, created_at, users!customer_id(name)')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async forFreelancer(freelancerId: string) {
    const { data, error } = await this.supabase.getAdminClient()
      .from('reviews')
      .select('id, rating, comment, created_at, services(title), users!customer_id(name)')
      .eq('freelancer_id', freelancerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async forOrder(orderId: string) {
    const { data } = await this.supabase.getAdminClient()
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('order_id', orderId)
      .maybeSingle();
    return data ?? null;
  }
}
