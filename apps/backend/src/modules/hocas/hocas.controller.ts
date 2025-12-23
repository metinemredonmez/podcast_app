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
import { HocasService } from './hocas.service';
import { CreateHocaDto } from './dto/create-hoca.dto';
import { UpdateHocaDto } from './dto/update-hoca.dto';
import { ListHocaDto } from './dto/list-hoca.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';

@ApiTags('hocas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hocas')
export class HocasController {
  constructor(private readonly service: HocasService) {}

  @Get()
  @ApiOperation({ summary: 'List mentors for a tenant' })
  findAll(@Query() query: ListHocaDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll({
      ...query,
      tenantId: query.tenantId ?? user.tenantId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mentor by id' })
  findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(tenantId ?? user.tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Create mentor' })
  create(@Body() dto: CreateHocaDto, @CurrentUser() user: JwtPayload) {
    return this.service.create({
      ...dto,
      tenantId: dto.tenantId ?? user.tenantId,
    });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Update mentor' })
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @Body() dto: UpdateHocaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(tenantId ?? user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete mentor' })
  remove(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.delete(tenantId ?? user.tenantId, id);
  }
}
