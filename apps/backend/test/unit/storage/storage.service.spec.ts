import 'reflect-metadata';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StorageService } from '../../../src/modules/storage/storage.service';
import { S3Service } from '../../../src/infra/s3/s3.service';
import { UserRole } from '../../../src/common/enums/prisma.enums';

describe('StorageService', () => {
  let service: StorageService;
  let s3: jest.Mocked<S3Service>;

  const actor = { tenantId: 'tenant-1', userId: 'user-1', role: UserRole.CREATOR };

  beforeEach(() => {
    s3 = {
      putObject: jest.fn(),
      getSignedUrl: jest.fn(),
      deleteObject: jest.fn(),
      getBucket: jest.fn().mockReturnValue('podcast-app'),
      getClient: jest.fn(),
    } as unknown as jest.Mocked<S3Service>;

    service = new StorageService(s3);
  });

  it('uploads file and returns signed url', async () => {
    const file = {
      buffer: Buffer.from('hello world'),
      mimetype: 'text/plain',
      originalname: 'greeting.txt',
      size: 11,
    } as Express.Multer.File;

    s3.getSignedUrl.mockResolvedValue('https://example.com/signed');

    const result = await service.uploadFile(file, actor, { prefix: 'docs', expiresIn: 4000 });

    expect(s3.putObject).toHaveBeenCalledWith(
      expect.stringMatching(/^tenant-1\/docs\//),
      file.buffer,
      'text/plain',
      expect.objectContaining({ 'x-amz-meta-original-name': 'greeting.txt' }),
    );
    expect(s3.getSignedUrl).toHaveBeenCalledWith(expect.any(String), 4000);
    expect(result).toEqual(
      expect.objectContaining({
        url: 'https://example.com/signed',
        bucket: 'podcast-app',
        expiresIn: 4000,
        sizeBytes: 11,
        mimeType: 'text/plain',
      }),
    );
  });

  it('throws when upload called without file', async () => {
    await expect(service.uploadFile(undefined, actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('generates signed url when key belongs to tenant', async () => {
    s3.getSignedUrl.mockResolvedValue('https://signed');

    const res = await service.getSignedUrl('tenant-1/file.txt', actor, 1200);

    expect(s3.getSignedUrl).toHaveBeenCalledWith('tenant-1/file.txt', 1200);
    expect(res.key).toBe('tenant-1/file.txt');
    expect(res.signedUrl).toBe('https://signed');
    expect(res.expiresIn).toBe(1200);
    expect(new Date(res.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('prevents access to keys outside tenant for non-admin', async () => {
    await expect(service.getSignedUrl('tenant-2/file.txt', actor)).rejects.toBeInstanceOf(ForbiddenException);
    expect(s3.getSignedUrl).not.toHaveBeenCalled();
  });

  it('allows admin to access any key', async () => {
    const admin = { tenantId: 'tenant-1', userId: 'admin', role: UserRole.ADMIN };
    s3.getSignedUrl.mockResolvedValue('https://signed');

    await service.getSignedUrl('other-tenant/file.txt', admin, 1000);

    expect(s3.getSignedUrl).toHaveBeenCalledWith('other-tenant/file.txt', 1000);
  });

  it('deletes object when key permitted', async () => {
    const response = await service.deleteObject('tenant-1/file.txt', actor);
    expect(s3.deleteObject).toHaveBeenCalledWith('tenant-1/file.txt');
    expect(response).toEqual({ key: 'tenant-1/file.txt', deleted: true });
  });
});
