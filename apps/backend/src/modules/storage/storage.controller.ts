import {
  Controller,
  Delete,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/prisma.enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UploadResponseDto } from './dto/upload-response.dto';
import { SignedUrlResponseDto } from './dto/signed-url-response.dto';
import { DeleteObjectResponseDto } from './dto/delete-object-response.dto';

@ApiTags('storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly service: StorageService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.CREATOR)
  @ApiOperation({ summary: 'Upload a file to object storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        prefix: { type: 'string', example: 'covers', nullable: true },
        expiresIn: { type: 'number', example: 3600, nullable: true },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: UploadResponseDto })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
    @Query('prefix') prefix?: string,
    @Query('expiresIn', new DefaultValuePipe(3600), ParseIntPipe) expiresIn?: number,
  ): Promise<UploadResponseDto> {
    return this.service.uploadFile(file, { userId: user.sub, tenantId: user.tenantId, role: user.role }, {
      prefix,
      expiresIn,
    });
  }

  @Get('file/*key')
  @Roles(UserRole.ADMIN, UserRole.CREATOR, UserRole.EDITOR, UserRole.LISTENER)
  @ApiOperation({ summary: 'Generate a signed download URL for a file' })
  @ApiOkResponse({ type: SignedUrlResponseDto })
  async getFileUrl(
    @Param('key') key: string,
    @CurrentUser() user: JwtPayload,
    @Query('expiresIn', new DefaultValuePipe(3600), ParseIntPipe) expiresIn?: number,
  ): Promise<SignedUrlResponseDto> {
    const decodedKey = decodeURIComponent(key);
    return this.service.getSignedUrl(decodedKey, { userId: user.sub, tenantId: user.tenantId, role: user.role }, expiresIn);
  }

  @Delete('file/*key')
  @Roles(UserRole.ADMIN, UserRole.CREATOR)
  @ApiOperation({ summary: 'Delete a file from object storage' })
  @ApiOkResponse({ type: DeleteObjectResponseDto })
  async deleteFile(
    @Param('key') key: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DeleteObjectResponseDto> {
    const decodedKey = decodeURIComponent(key);
    return this.service.deleteObject(decodedKey, { userId: user.sub, tenantId: user.tenantId, role: user.role });
  }
}
