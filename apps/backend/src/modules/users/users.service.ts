import { Inject, Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';
import { USERS_REPOSITORY, UsersRepository, UserModel } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/prisma.enums';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly passwordSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository) {}

  async findAll(query: CursorPaginationDto, actor: JwtPayload): Promise<PaginatedResponseDto<UserResponseDto>> {
    this.ensureAdmin(actor);
    const limit = query.limit ?? 20;
    const decodedRaw = query.cursor ? decodeCursor(query.cursor) : undefined;
    const decoded = decodedRaw || undefined;
    const sortableFields: (keyof UserModel)[] = ['createdAt', 'email', 'name'];
    const requestedOrder = (query.orderBy ?? 'createdAt') as keyof UserModel;
    const orderBy = sortableFields.includes(requestedOrder) ? requestedOrder : 'createdAt';
    const rows = await this.usersRepository.findMany({
      tenantId: actor.tenantId,
      cursor: decoded,
      limit,
      orderBy,
      orderDirection: query.orderDirection ?? 'desc',
    });
    const paginated = buildPaginatedResponse(rows, limit, (user) => user.id);
    return {
      ...paginated,
      data: paginated.data.map((user) => this.toResponseDto(user)),
    };
  }

  async findOne(id: string, actor: JwtPayload): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id, actor.tenantId);
    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }
    this.ensureCanAccessUser(actor, user);
    return this.toResponseDto(user);
  }

  async create(payload: CreateUserDto, actor: JwtPayload): Promise<UserResponseDto> {
    this.ensureAdmin(actor);
    if (payload.tenantId && payload.tenantId !== actor.tenantId) {
      throw new ForbiddenException('Cannot create users in a different tenant.');
    }

    const existing = await this.usersRepository.findByEmail(payload.email);
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await bcrypt.hash(payload.password, this.passwordSaltRounds);
    const user = await this.usersRepository.create({
      tenantId: actor.tenantId,
      email: payload.email,
      passwordHash,
      name: payload.name,
      role: payload.role ?? UserRole.LISTENER,
    });
    return this.toResponseDto(user);
  }

  async update(id: string, payload: UpdateUserDto, actor: JwtPayload): Promise<UserResponseDto> {
    this.ensureAdmin(actor);
    const user = await this.usersRepository.findById(id, actor.tenantId);
    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }
    const updated = await this.usersRepository.update(id, actor.tenantId, {
      name: payload.name ?? undefined,
      role: payload.role ?? undefined,
      isActive: payload.isActive ?? undefined,
    });
    return this.toResponseDto(updated);
  }

  async updateOwnProfile(payload: UpdateProfileDto, actor: JwtPayload): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(actor.userId, actor.tenantId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const updated = await this.usersRepository.update(actor.userId, actor.tenantId, {
      name: payload.name ?? undefined,
    });
    return this.toResponseDto(updated);
  }

  async changePassword(payload: ChangePasswordDto, actor: JwtPayload): Promise<void> {
    const user = await this.usersRepository.findById(actor.userId, actor.tenantId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(payload.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(payload.newPassword, this.passwordSaltRounds);
    await this.usersRepository.updatePassword(actor.userId, actor.tenantId, newPasswordHash);
  }

  private ensureAdmin(actor: JwtPayload) {
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only tenant admins may manage users.');
    }
  }

  private ensureCanAccessUser(actor: JwtPayload, target: UserModel) {
    if (actor.role === UserRole.ADMIN && target.tenantId === actor.tenantId) {
      return;
    }
    if (actor.sub !== target.id) {
      throw new ForbiddenException('You do not have access to this user.');
    }
  }

  private toResponseDto(user: UserModel): UserResponseDto {
    return plainToInstance(UserResponseDto, {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
