import 'reflect-metadata';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { AdminController } from '../../../src/modules/admin/admin.controller';
import { AnalyticsController } from '../../../src/modules/analytics/analytics.controller';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { CategoriesController } from '../../../src/modules/categories/categories.controller';
import { CommentsController } from '../../../src/modules/comments/comments.controller';
import { EpisodesController } from '../../../src/modules/episodes/episodes.controller';
import { FollowsController } from '../../../src/modules/follows/follows.controller';
import { HocasController } from '../../../src/modules/hocas/hocas.controller';
import { NotificationsController } from '../../../src/modules/notifications/notifications.controller';
import { PodcastsController } from '../../../src/modules/podcasts/podcasts.controller';
import { SearchController } from '../../../src/modules/search/search.controller';
import { StorageController } from '../../../src/modules/storage/storage.controller';
import { StreamingController } from '../../../src/modules/streaming/streaming.controller';
import { UsersController } from '../../../src/modules/users/users.controller';

describe('Controller guard configuration', () => {
  const guardedControllers = [
    AdminController,
    AnalyticsController,
    AuthController,
    CategoriesController,
    CommentsController,
    EpisodesController,
    FollowsController,
    HocasController,
    NotificationsController,
    PodcastsController,
    SearchController,
    StorageController,
    StreamingController,
    UsersController,
  ];

  it('applies JwtAuthGuard and RolesGuard at class level', () => {
    guardedControllers.forEach((controller) => {
      const guards = Reflect.getMetadata('__guards__', controller) ?? [];
      const guardTokens = guards.map((guard: any) => guard && (guard.name ?? guard.constructor?.name));
      expect(guardTokens).toEqual(expect.arrayContaining([JwtAuthGuard.name, RolesGuard.name]));
    });
  });
});
