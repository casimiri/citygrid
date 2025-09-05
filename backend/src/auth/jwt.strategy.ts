import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { SupabaseService } from './supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const { sub, email, org_id } = payload;

    if (!sub || !email || !org_id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const supabase = this.supabaseService.getClient();
    const { data: membership } = await supabase
      .from('membership')
      .select('role')
      .eq('user_id', sub)
      .eq('org_id', org_id)
      .single();

    if (!membership) {
      throw new UnauthorizedException('User not member of organization');
    }

    return {
      ...payload,
      role: membership.role,
    };
  }
}