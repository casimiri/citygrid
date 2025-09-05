import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from './supabase.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
  ) {}

  async generateJwtToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    return this.jwtService.sign(payload);
  }

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      return null;
    }
  }

  async getUserMemberships(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('membership')
      .select(`
        role,
        org:org_id (
          id,
          name,
          slug,
          subscription_status
        )
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch memberships: ${error.message}`);
    }

    return data;
  }

  async createAuditLog(
    orgId: string,
    userId: string,
    action: string,
    entity: string,
    before?: any,
    after?: any,
  ) {
    const supabase = this.supabaseService.getClient();
    await supabase.from('audit_log').insert({
      org_id: orgId,
      user_id: userId,
      action,
      entity,
      before,
      after,
      created_at: new Date().toISOString(),
    });
  }
}