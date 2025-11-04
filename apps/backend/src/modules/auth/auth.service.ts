import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, AuthTokensDto, AuthUserDto } from './dto/auth-response.dto';
import { USERS_REPOSITORY, UsersRepository, UserModel } from '../users/repositories/users.repository';
import { Inject } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';

@Injectable()
export class AuthService {
  private readonly passwordSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.passwordSaltRounds);
    const user = await this.usersRepository.create({
      tenantId: dto.tenantId,
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: dto.role ?? UserRole.LISTENER,
    });

    const tokens = await this.issueTokens(user);
    await this.saveRefreshTokenHash(user.id, user.tenantId, tokens.refreshToken);
    return { tokens, user: this.toAuthUser(user) };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is disabled.');
    }

    const tokens = await this.issueTokens(user);
    await this.saveRefreshTokenHash(user.id, user.tenantId, tokens.refreshToken);
    return { tokens, user: this.toAuthUser(user) };
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token secret is not configured.');
    }
    const payload = await this.jwtService
      .verifyAsync<JwtPayload>(dto.refreshToken, { secret: refreshSecret })
      .catch(() => {
        throw new UnauthorizedException('Invalid refresh token.');
      });

    const user = await this.usersRepository.findById(payload.sub, payload.tenantId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (payload.sub !== user.id) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const tokenMatches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash ?? '');
    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const tokens = await this.issueTokens(user);
    await this.saveRefreshTokenHash(user.id, user.tenantId, tokens.refreshToken);
    return { tokens, user: this.toAuthUser(user) };
  }

  async logout(userId: string, tenantId: string): Promise<void> {
    await this.usersRepository.update(userId, tenantId, { refreshTokenHash: null });
  }

  async getProfile(userId: string, tenantId: string): Promise<AuthUserDto> {
    const user = await this.usersRepository.findById(userId, tenantId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return this.toAuthUser(user);
  }

  private async issueTokens(user: UserModel): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token secret is not configured.');
    }
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>('jwt.refreshTokenTtl', '7d'),
    });
    return { accessToken, refreshToken };
  }

  private async saveRefreshTokenHash(userId: string, tenantId: string, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, this.passwordSaltRounds);
    await this.usersRepository.update(userId, tenantId, { refreshTokenHash: hashed });
  }

  private toAuthUser(user: UserModel): AuthUserDto {
    return plainToInstance(AuthUserDto, {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
    });
  }
}
