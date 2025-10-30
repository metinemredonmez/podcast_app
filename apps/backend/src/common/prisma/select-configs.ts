export const userBasicSelect = {
  id: true,
  tenantId: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const podcastListSelect = {
  id: true,
  tenantId: true,
  ownerId: true,
  title: true,
  slug: true,
  description: true,
  coverImageUrl: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const episodeListSelect = {
  id: true,
  tenantId: true,
  podcastId: true,
  title: true,
  slug: true,
  duration: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
} as const;

