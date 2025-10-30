import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload, RefreshPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('register')
  @ApiOkResponse({ type: AuthResponseDto })
  register(@Body() payload: RegisterDto): Promise<AuthResponseDto> {
    return this.service.register(payload);
  }

  @Public()
  @Post('login')
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() payload: LoginDto): Promise<AuthResponseDto> {
    return this.service.login(payload);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@CurrentUser() user: RefreshPayload, @Body() payload: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshToken = payload?.refreshToken ?? user.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required.');
    }
    return this.service.refreshTokens({ refreshToken });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Successfully logged out' })
  async logout(@CurrentUser() user: JwtPayload): Promise<{ success: boolean }> {
    await this.service.logout(user.sub);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser() user: JwtPayload): Promise<AuthUserDto> {
    return this.service.getProfile(user.sub);
  }
}
