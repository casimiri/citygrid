import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';

interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  orgName: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user and organization' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    const memberships = await this.authService.getUserMemberships(user.sub);
    return {
      user: {
        id: user.sub,
        email: user.email,
        currentOrg: user.org_id,
        currentRole: user.role,
      },
      memberships,
    };
  }

  @Get('memberships')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user memberships' })
  async getMemberships(@CurrentUser() user: JwtPayload) {
    return this.authService.getUserMemberships(user.sub);
  }
}