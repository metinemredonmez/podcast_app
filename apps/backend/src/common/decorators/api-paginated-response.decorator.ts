import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

export const ApiCursorPaginatedResponse = (itemSchema: Record<string, unknown>) =>
  applyDecorators(
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: itemSchema },
          nextCursor: { type: 'string', nullable: true, example: 'YWJjLTEyMw==' },
          hasMore: { type: 'boolean', example: true },
          total: { type: 'number', nullable: true, example: 123 },
        },
      },
    }),
  );
