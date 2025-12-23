import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StreamingService } from './streaming.service';
import { ListStreamingDto } from './dto/list-streaming.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateStreamingDto } from './dto/update-streaming.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('streaming')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('streaming')
export class StreamingController {
  constructor(private readonly service: StreamingService) {}

  @Get()
  @ApiOperation({ summary: 'List streaming sessions for a tenant' })
  findAll(@Query() filter: ListStreamingDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(
      {
        ...filter,
        tenantId: filter.tenantId ?? user.tenantId,
      },
      { userId: user.sub, tenantId: user.tenantId, role: user.role },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get streaming session by id' })
  findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(tenantId ?? user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      role: user.role,
    });
  }

  @Post()
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create streaming session' })
  create(@Body() dto: CreateSessionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(
      {
        ...dto,
        tenantId: dto.tenantId ?? user.tenantId,
      },
      { userId: user.sub, tenantId: user.tenantId, role: user.role },
    );
  }

  @Patch(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update streaming session metadata' })
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @Body() dto: UpdateStreamingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(tenantId ?? user.tenantId, id, dto, {
      userId: user.sub,
      tenantId: user.tenantId,
      role: user.role,
    });
  }

  @Patch(':id/status')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update streaming session status' })
  updateStatus(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @Body() dto: UpdateSessionStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateStatus(tenantId ?? user.tenantId, id, dto, {
      userId: user.sub,
      tenantId: user.tenantId,
      role: user.role,
    });
  }

  @Delete(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete streaming session' })
  remove(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.delete(tenantId ?? user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      role: user.role,
    });
  }
}
