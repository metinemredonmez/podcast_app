import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { USERS_REPOSITORY } from './repositories/users.repository';
import { UsersPrismaRepository } from './repositories/users.prisma.repository';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersPrismaRepository,
    },
  ],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
