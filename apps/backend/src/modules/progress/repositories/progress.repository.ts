export const PROGRESS_REPOSITORY = Symbol('PROGRESS_REPOSITORY');

export interface ProgressModel {
  id: string;
  tenantId: string;
  userId: string;
  episodeId: string;
  progressSeconds: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressWithEpisode extends ProgressModel {
  episode: {
    id: string;
    title: string;
    slug: string;
    duration: number;
    audioUrl: string;
    podcastId: string;
  };
}

export interface CreateProgressInput {
  tenantId: string;
  userId: string;
  episodeId: string;
  progressSeconds: number;
  completed?: boolean;
}

export interface UpdateProgressInput {
  progressSeconds: number;
  completed?: boolean;
}

export interface ProgressRepository {
  findByUserId(userId: string, tenantId: string): Promise<ProgressWithEpisode[]>;
  findByUserAndEpisode(userId: string, episodeId: string, tenantId: string): Promise<ProgressModel | null>;
  create(payload: CreateProgressInput): Promise<ProgressModel>;
  update(userId: string, episodeId: string, tenantId: string, payload: UpdateProgressInput): Promise<ProgressModel>;
  delete(userId: string, episodeId: string, tenantId: string): Promise<void>;
}
