import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CursorPaginationDto, PaginatedResponseDto } from '../../common/dto/cursor-pagination.dto';
import { buildPaginatedResponse, decodeCursor } from '../../common/utils/pagination.util';
import { USERS_REPOSITORY, UsersRepository, UserModel } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/prisma.enums';

@Injectable()
export class UsersService {
  private readonly passwordSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  constructor(@Inject(USERS_REPOSITORY) private readonly usersRepository: UsersRepository) {}

  async findAll(query: CursorPaginationDto): Promise<PaginatedResponseDto<UserResponseDto>> {
    const limit = query.limit ?? 20;
    const decodedRaw = query.cursor ? decodeCursor(query.cursor) : undefined;
    const decoded = decodedRaw || undefined;
    const sortableFields: (keyof UserModel)[] = ['createdAt', 'email', 'name'];
    const requestedOrder = (query.orderBy ?? 'createdAt') as keyof UserModel;
    const orderBy = sortableFields.includes(requestedOrder) ? requestedOrder : 'createdAt';
    const rows = await this.usersRepository.findMany({
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

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }
    return this.toResponseDto(user);
  }

  async create(payload: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.usersRepository.findByEmail(payload.email);
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await bcrypt.hash(payload.password, this.passwordSaltRounds);
    const user = await this.usersRepository.create({
      tenantId: payload.tenantId,
      email: payload.email,
      passwordHash,
      name: payload.name,
      role: payload.role ?? UserRole.LISTENER,
    });
    return this.toResponseDto(user);
  }

  async update(id: string, payload: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found.`);
    }
    const updated = await this.usersRepository.update(id, {
      name: payload.name ?? undefined,
      role: payload.role ?? undefined,
      isActive: payload.isActive ?? undefined,
    });
    return this.toResponseDto(updated);
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
