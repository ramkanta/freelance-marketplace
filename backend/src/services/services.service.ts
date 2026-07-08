import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateServiceDto) {
    const client = this.supabaseService.getAdminClient();

    // Resolve freelancer_profile id from the authenticated user id
    const { data: profile, error: profileError } = await client
      .from('freelancer_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      throw new NotFoundException('Freelancer profile not found. Complete onboarding first.');
    }

    const { data, error } = await client
      .from('services')
      .insert({
        freelancer_id: profile.id,
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category,
        price: dto.price,
        delivery_days: dto.deliveryDays ?? 3,
      })
      .select('*')
      .single();

    if (error) throw new NotFoundException(`Failed to create service: ${error.message}`);
    return data;
  }

  async findAll(query: QueryServicesDto) {
    const client = this.supabaseService.getAdminClient();
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const offset = (page - 1) * limit;

    let builder = client
      .from('services')
      .select(`
        *,
        freelancer_profiles (
          id,
          category,
          rating_avg,
          users ( name )
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.category) {
      builder = builder.ilike('category', `%${query.category}%`);
    }
    if (query.query) {
      builder = builder.or(`title.ilike.%${query.query}%,description.ilike.%${query.query}%`);
    }
    if (query.minPrice !== undefined) {
      builder = builder.gte('price', query.minPrice);
    }
    if (query.maxPrice !== undefined) {
      builder = builder.lte('price', query.maxPrice);
    }

    const { data, error, count } = await builder;
    if (error) throw new NotFoundException(`Failed to fetch services: ${error.message}`);

    return {
      data,
      meta: { total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) },
    };
  }

  async findOne(id: string) {
    const client = this.supabaseService.getAdminClient();

    const { data, error } = await client
      .from('services')
      .select(`
        *,
        freelancer_profiles (
          id,
          category,
          rating_avg,
          bio,
          users ( name, email )
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) throw new NotFoundException('Service not found.');
    return data;
  }

  async update(id: string, userId: string, dto: UpdateServiceDto) {
    const client = this.supabaseService.getAdminClient();

    // Verify the authenticated user owns this service
    const { data: existing } = await client
      .from('services')
      .select('id, freelancer_profiles!inner(user_id)')
      .eq('id', id)
      .maybeSingle();

    if (!existing) throw new NotFoundException('Service not found.');

    const ownerUserId = (existing as any).freelancer_profiles?.user_id;
    if (ownerUserId !== userId) {
      throw new ForbiddenException('You can only edit your own services.');
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.category !== undefined) updatePayload.category = dto.category;
    if (dto.price !== undefined) updatePayload.price = dto.price;
    if (dto.deliveryDays !== undefined) updatePayload.delivery_days = dto.deliveryDays;
    if (dto.isActive !== undefined) updatePayload.is_active = dto.isActive;

    const { data, error } = await client
      .from('services')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new NotFoundException(`Failed to update service: ${error.message}`);
    return data;
  }

  async remove(id: string, userId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: existing } = await client
      .from('services')
      .select('id, freelancer_profiles!inner(user_id)')
      .eq('id', id)
      .maybeSingle();

    if (!existing) throw new NotFoundException('Service not found.');

    const ownerUserId = (existing as any).freelancer_profiles?.user_id;
    if (ownerUserId !== userId) {
      throw new ForbiddenException('You can only delete your own services.');
    }

    // Soft-delete: mark inactive rather than destroy the record
    const { error } = await client
      .from('services')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new NotFoundException(`Failed to delete service: ${error.message}`);
    return { message: 'Service removed successfully.' };
  }

  async findByFreelancer(freelancerProfileId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('freelancer_id', freelancerProfileId)
      .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(`Failed to fetch services: ${error.message}`);
    return data;
  }
}
