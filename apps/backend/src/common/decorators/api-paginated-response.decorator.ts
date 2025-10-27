import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

export const ApiPaginatedResponse = (model: unknown) =>
  applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          data: {
            type: 'array',
            items: { $ref: model },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              pageSize: { type: 'number' },
            },
          },
        },
      },
    }),
  );
