import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from './supabase.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  orgName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, orgName } = registerDto;
    const supabase = this.supabaseService.getClient();

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) {
        throw new Error(`Auth signup failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Create user profile (required by foreign key constraints)
      const { error: profileError } = await supabase
        .from('user_profile')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName
        });

      if (profileError) {
        throw new Error(`User profile creation failed: ${profileError.message}`);
      }

      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('org')
        .insert({
          name: orgName,
          slug: orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          subscription_status: 'trialing'
        })
        .select()
        .single();

      if (orgError) {
        throw new Error(`Organization creation failed: ${orgError.message}`);
      }

      // Create membership
      const { error: membershipError } = await supabase
        .from('membership')
        .insert({
          user_id: authData.user.id,
          org_id: orgData.id,
          role: 'admin'
        });

      if (membershipError) {
        throw new Error(`Membership creation failed: ${membershipError.message}`);
      }

      return {
        message: 'User and organization created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        organization: {
          id: orgData.id,
          name: orgData.name,
        }
      };

    } catch (error: any) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

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