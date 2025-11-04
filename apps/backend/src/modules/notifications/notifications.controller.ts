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
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/prisma.enums';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for a tenant (optionally scoped to a user)' })
  findAll(@Query() query: ListNotificationsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by id' })
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a notification' })
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Post('send')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enqueue a notification to be processed asynchronously' })
  send(@Body() dto: SendNotificationDto) {
    return this.service.send(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update notification payload or read state' })
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markAsRead(
    @Param('id') id: string,
    @Body() dto: MarkNotificationReadDto,
  ) {
    return this.service.markAsRead(id, dto);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications for a user as read' })
  markAllAsRead(@Body() dto: MarkNotificationReadDto) {
    return this.service.markAllAsRead(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.service.delete(tenantId, id);
  }
}
