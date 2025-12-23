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
import { CommentsService } from './comments.service';
import { ListCommentsDto } from './dto/list-comments.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.CREATOR, UserRole.LISTENER)
  @ApiOperation({ summary: 'List comments for a tenant with optional episode/podcast filters' })
  findAll(@Query() query: ListCommentsDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll({
      ...query,
      tenantId: query.tenantId ?? user.tenantId,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.CREATOR, UserRole.LISTENER)
  @ApiOperation({ summary: 'Get a comment by id' })
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(tenantId ?? user.tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CREATOR, UserRole.LISTENER)
  @ApiOperation({ summary: 'Create a new comment' })
  create(@Body() dto: CreateCommentDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(
      {
        ...dto,
        tenantId: dto.tenantId ?? user.tenantId,
        userId: user.sub,
      },
      { userId: user.sub, tenantId: user.tenantId, role: user.role },
    );
  }

  @Post(':id/replies')
  @Roles(UserRole.ADMIN, UserRole.CREATOR, UserRole.LISTENER)
  @ApiOperation({ summary: 'Reply to an existing comment' })
  reply(@Param('id') id: string, @Body() dto: ReplyCommentDto, @CurrentUser() user: JwtPayload) {
    return this.service.reply(
      id,
      {
        ...dto,
        tenantId: dto.tenantId ?? user.tenantId,
        userId: user.sub,
      },
      { userId: user.sub, tenantId: user.tenantId, role: user.role },
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CREATOR, UserRole.LISTENER)
  @ApiOperation({ summary: 'Update a comment' })
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string | undefined,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(tenantId ?? user.tenantId, id, dto, {
      userId: user.sub,
      tenantId: user.tenantId,
      role: user.role,
    });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CREATOR, UserRole.LISTENER)
  @ApiOperation({ summary: 'Delete a comment' })
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string | undefined, @CurrentUser() user: JwtPayload) {
    return this.service.delete(tenantId ?? user.tenantId, id, {
      userId: user.sub,
      tenantId: user.tenantId,
      role: user.role,
    });
  }
}
