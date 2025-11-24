# Pagination Implementation Guide

Complete guide for using the standardized pagination system in both backend and frontend.

---

## 📦 Overview

This project now has a **dual pagination strategy**:

1. **Cursor-based** (for Podcasts, Episodes) - Better performance, infinite scroll
2. **Offset-based** (for Admin panel) - Traditional page numbers, easier to implement

---

## 🔧 Backend Usage

### 1. Using Standard OffsetPaginationDTO

All list endpoints should extend `OffsetPaginationDto`:

```typescript
// your-module/dto/list-items.dto.ts
import { OffsetPaginationDto } from '../../../common/dto/offset-pagination.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class ListItemsDto extends OffsetPaginationDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  // Add your custom filters here
}
```

This automatically includes:
- `page?: number` (default: 1)
- `limit?: number` (default: 10, max: 100)
- `sortBy?: string` (default: 'createdAt')
- `sortOrder?: 'asc' | 'desc'` (default: 'desc')
- `search?: string`

### 2. Service Implementation

```typescript
import {
  buildOffsetPaginatedResponse,
  buildPrismaOffsetQuery,
} from '../../common/utils/pagination.util';
import { ListItemsDto } from './dto/list-items.dto';
import { OffsetPaginatedResponse } from '../../common/dto/offset-pagination.dto';

async findAll(dto: ListItemsDto): Promise<OffsetPaginatedResponse<YourModel>> {
  // Build Prisma query from DTO
  const query = buildPrismaOffsetQuery(dto);

  // Build where clause
  const where = {
    tenantId: dto.tenantId,
    // Add your filters
  };

  // Fetch data and count in parallel
  const [data, total] = await Promise.all([
    this.prisma.yourModel.findMany({
      where,
      ...query, // Includes skip, take, orderBy
    }),
    this.prisma.yourModel.count({ where }),
  ]);

  // Build paginated response
  return buildOffsetPaginatedResponse(data, total, dto.page ?? 1, dto.limit ?? 10);
}
```

### 3. Controller Example

```typescript
@Get()
@ApiOperation({ summary: 'List items with pagination' })
findAll(@Query() dto: ListItemsDto) {
  return this.service.findAll(dto);
}
```

### API Response Format

```json
{
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🎨 Frontend Usage (Admin Panel)

### 1. Basic Page with Pagination

```typescript
import { useState } from 'react';
import { usePagination } from '../hooks';
import { PaginationControls } from '../components/PaginationControls';
import { PaginatedResponse } from '../types';
import { yourApiService } from '../api/services/your-service';

export const YourListPage = () => {
  const [data, setData] = useState<PaginatedResponse<YourModel> | null>(null);
  const [loading, setLoading] = useState(false);

  const pagination = usePagination({
    initialLimit: 10,
    syncWithURL: true, // Syncs with URL query params
  });

  // Fetch data whenever pagination changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await yourApiService.list(pagination.paginationParams);
        setData(response);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pagination.paginationParams]);

  return (
    <div>
      <h1>Your List</h1>

      {/* Search */}
      <input
        type="text"
        value={pagination.search}
        onChange={(e) => pagination.setSearch(e.target.value)}
        placeholder="Search..."
      />

      {/* Table */}
      {loading ? (
        <div>Loading...</div>
      ) : data?.data.length === 0 ? (
        <div>No data found</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th onClick={() => pagination.setSort('name')}>
                Name {pagination.sortBy === 'name' && (pagination.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => pagination.setSort('createdAt')}>
                Created {pagination.sortBy === 'createdAt' && (pagination.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      {data?.meta && (
        <PaginationControls
          meta={data.meta}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setLimit}
          showPageSize
          showInfo
        />
      )}
    </div>
  );
};
```

### 2. API Service with Pagination

```typescript
// your-service.ts
import { api } from './api-client';
import { PaginatedResponse, PaginationParams } from '../types';

export const yourApiService = {
  list: async (params: PaginationParams): Promise<PaginatedResponse<YourModel>> => {
    const queryString = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(params.search && { search: params.search }),
    }).toString();

    const response = await api.get<PaginatedResponse<YourModel>>(`/your-endpoint?${queryString}`);
    return response.data;
  },
};
```

### 3. Custom Pagination Options

```typescript
const pagination = usePagination({
  initialPage: 1,
  initialLimit: 25,
  initialSortBy: 'name',
  initialSortOrder: 'asc',
  syncWithURL: true, // Enable/disable URL sync
  onPaginationChange: (params) => {
    console.log('Pagination changed:', params);
  },
});
```

### 4. PaginationControls Props

```typescript
<PaginationControls
  meta={data.meta} // Required: Pagination metadata from API
  onPageChange={setPage} // Required: Page change handler
  onPageSizeChange={setLimit} // Required: Page size change handler
  showPageSize={true} // Show page size selector
  showInfo={true} // Show "Showing X-Y of Z results"
  maxPageButtons={7} // Max page buttons to show
  className="my-custom-class" // Custom CSS class
/>
```

---

## 🔄 Migration Guide

### Migrating Existing List Pages

1. **Update DTO to extend OffsetPaginationDto:**

```typescript
// Before
export class ListItemsDto {
  page?: number = 1;
  limit?: number = 20;
}

// After
export class ListItemsDto extends OffsetPaginationDto {
  // Your custom fields only
}
```

2. **Update Service to use pagination utils:**

```typescript
// Before
async findAll(dto: ListItemsDto) {
  const skip = (dto.page - 1) * dto.limit;
  const data = await this.prisma.item.findMany({ skip, take: dto.limit });
  const total = await this.prisma.item.count();
  return { data, total };
}

// After
async findAll(dto: ListItemsDto) {
  const query = buildPrismaOffsetQuery(dto);
  const [data, total] = await Promise.all([
    this.prisma.item.findMany(query),
    this.prisma.item.count(),
  ]);
  return buildOffsetPaginatedResponse(data, total, dto.page ?? 1, dto.limit ?? 10);
}
```

3. **Update Frontend to use usePagination hook:**

```typescript
// Before
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(10);

// After
const pagination = usePagination({ initialLimit: 10 });
// Use pagination.page, pagination.setPage, etc.
```

---

## 📝 Already Migrated

✅ **Backend DTOs:**
- `ListHocaDto`
- `ListCommentsDto`
- `ListCategoriesDto`
- `ListNotificationsDto`
- `ListUsersDto`

✅ **Backend Utils:**
- `pagination.util.ts` (both cursor and offset helpers)

✅ **Frontend Infrastructure:**
- `types/pagination.ts`
- `hooks/usePagination.ts`
- `components/PaginationControls.tsx`

---

## 🚀 Testing

### Backend Tests

```typescript
describe('Pagination', () => {
  it('should return paginated results', async () => {
    const dto: ListItemsDto = { page: 2, limit: 10 };
    const result = await service.findAll(dto);

    expect(result.data).toHaveLength(10);
    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.hasNextPage).toBeDefined();
  });

  it('should handle empty results', async () => {
    const dto: ListItemsDto = { page: 999, limit: 10 };
    const result = await service.findAll(dto);

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});
```

### Frontend Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  it('should initialize with defaults', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(10);
  });

  it('should change page', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.page).toBe(2);
  });
});
```

---

## 🎯 Best Practices

1. **Always use standard DTOs** - Extend `OffsetPaginationDto` instead of creating custom pagination fields
2. **Use pagination utils** - Don't calculate skip/take manually
3. **Sync with URL** - Enable `syncWithURL: true` for better UX (browser back/forward works)
4. **Reset to page 1** - When filters/search change, reset to first page
5. **Show loading states** - Display loading indicator while fetching
6. **Handle empty states** - Show meaningful message when no data
7. **Validate inputs** - DTO validation automatically handles this on backend
8. **Use parallel queries** - Fetch data and count in `Promise.all()` for better performance

---

## 📚 API Documentation

### Swagger Example

The pagination params are automatically documented in Swagger:

```
GET /api/hocas?page=1&limit=10&sortBy=name&sortOrder=asc&search=john
```

Query Parameters:
- `page` (integer, min: 1, default: 1)
- `limit` (integer, min: 1, max: 100, default: 10)
- `sortBy` (string, default: "createdAt")
- `sortOrder` (enum: "asc" | "desc", default: "desc")
- `search` (string, optional)

---

## 🐛 Troubleshooting

**Q: Pagination doesn't update URL**
A: Make sure `syncWithURL: true` and you're using `react-router-dom`'s `useSearchParams`

**Q: Page resets to 1 unexpectedly**
A: This is intentional when `search`, `sortBy`, or `limit` changes

**Q: Total count is expensive to calculate**
A: Consider caching the count or using `COUNT(*)` with filters

**Q: How to disable page size selector?**
A: Set `showPageSize={false}` on `PaginationControls`

---

## 📞 Support

For questions or issues:
1. Check this guide first
2. Look at existing implementations (Hocas, Comments, Categories)
3. Ask the team

---

**Last Updated:** 2025-01-24
**Version:** 1.0.0
