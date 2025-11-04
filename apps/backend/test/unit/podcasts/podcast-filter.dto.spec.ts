import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PodcastFilterDto } from '../../../src/modules/podcasts/dto/podcast-filter.dto';

describe('PodcastFilterDto', () => {
  it('enforces validation rules on filter properties', async () => {
    const dto = plainToInstance(PodcastFilterDto, {
      tenantId: 'invalid',
      ownerId: 'not-a-uuid',
      categoryId: 'still-invalid',
      isPublished: 'nope',
      search: 123,
    });

    const errors = await validate(dto);
    const propertiesWithErrors = errors.map((error) => error.property);

    expect(propertiesWithErrors).toEqual(
      expect.arrayContaining(['tenantId', 'ownerId', 'categoryId', 'isPublished', 'search']),
    );
  });
});
