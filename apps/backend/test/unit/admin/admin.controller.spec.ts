import 'reflect-metadata';
import { AdminController } from '../../../src/modules/admin/admin.controller';
import { AdminService } from '../../../src/modules/admin/admin.service';
import { ROLES_KEY } from '../../../src/common/decorators/roles.decorator';
import { UserRole } from '../../../src/common/enums/prisma.enums';

describe('AdminController RBAC', () => {
  it('enforces admin/editor roles on tenant listing', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, AdminController.prototype.listTenants);
    expect(roles).toEqual(expect.arrayContaining([UserRole.ADMIN, UserRole.EDITOR]));
  });

  it('delegates listTenants to service', async () => {
    const service = {
      listTenants: jest.fn(),
    } as unknown as AdminService;

    const controller = new AdminController(service);
    await controller.listTenants({ search: 'demo' });
    expect(service.listTenants).toHaveBeenCalledWith({ search: 'demo' });
  });
});
