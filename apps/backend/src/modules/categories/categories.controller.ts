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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List categories for a tenant' })
  list(@Query() query: ListCategoriesDto, @CurrentUser() user?: JwtPayload) {
    return this.service.list({
      ...query,
      tenantId: query.tenantId ?? user?.tenantId,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by id' })
  findOne(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.service.findOne(tenantId ?? user?.tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayload) {
    return this.service.create({
      ...dto,
      tenantId: dto.tenantId ?? user.tenantId,
    });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(tenantId ?? user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.service.delete(tenantId ?? user.tenantId, id);
  }
}
