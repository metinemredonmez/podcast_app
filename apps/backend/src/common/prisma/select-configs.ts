export const userBasicSelect = {
  id: true,
  email: true,
  name: true,
} as const;

export const podcastListSelect = {
  id: true,
  title: true,
  description: true,
  userId: true,
  createdAt: true,
} as const;

export const episodeListSelect = {
  id: true,
  title: true,
  duration: true,
  publishedAt: true,
} as const;


