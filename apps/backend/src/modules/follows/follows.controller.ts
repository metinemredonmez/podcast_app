import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { FollowDto } from './dto/follow.dto';
import { ListFollowsDto } from './dto/list-follows.dto';
import { ListFollowersDto } from './dto/list-followers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../../common/enums/prisma.enums';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('follows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly service: FollowsService) {}

  @Get()
  @ApiOperation({ summary: 'List followed podcasts for the current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  list(@Query() query: ListFollowsDto, @CurrentUser() user: JwtPayload) {
    return this.service.listByUser(query, user);
  }

  @Get('followers')
  @Roles(UserRole.CREATOR, UserRole.HOCA, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List followers for creator podcasts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  listFollowers(@Query() query: ListFollowersDto, @CurrentUser() user: JwtPayload) {
    return this.service.listFollowers(query, user);
  }

  @Post()
  @Roles(UserRole.LISTENER, UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Follow a podcast' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  follow(@Body() dto: FollowDto, @CurrentUser() user: JwtPayload) {
    return this.service.follow(dto, user);
  }

  @Delete()
  @Roles(UserRole.LISTENER, UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Unfollow a podcast' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async unfollow(@Body() dto: FollowDto, @CurrentUser() user: JwtPayload) {
    await this.service.unfollow(dto, user);
    return { success: true };
  }
}
