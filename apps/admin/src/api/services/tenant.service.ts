import { apiClient } from '../client';

// Types
export type TenantStatus = 'active' | 'suspended' | 'trial';
export type TenantPlan = 'free' | 'pro' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  plan: TenantPlan;
  status: TenantStatus;
  adminEmail: string;
  userCount: number;
  podcastCount: number;
  episodeCount: number;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  bandwidthUsed: number; // in bytes
  bandwidthLimit: number; // in bytes
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  settings?: TenantSettings;
  billing?: TenantBilling;
}

export interface TenantSettings {
  maxUsers: number;
  maxPodcasts: number;
  maxStorageGB: number;
  maxBandwidthGB: number;
  customBranding: boolean;
  analytics: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  ssoEnabled: boolean;
  webhooksEnabled: boolean;
}

export interface TenantBilling {
  plan: TenantPlan;
  interval: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  nextBillingDate?: string;
  paymentMethod?: string;
  lastPaymentDate?: string;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'invited';
  lastActiveAt?: string;
  createdAt: string;
}

export interface TenantApiKey {
  id: string;
  name: string;
  key: string; // masked, e.g., "sk_live_****abcd"
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface TenantActivity {
  id: string;
  type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'settings' | 'billing';
  action: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface TenantLoginHistory {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
}

export interface TenantStats {
  total: number;
  active: number;
  suspended: number;
  trial: number;
  trialEndingSoon: number; // trials ending in 7 days
  totalRevenue?: number;
  byPlan: {
    free: number;
    pro: number;
    enterprise: number;
  };
}

export interface TenantListResponse {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTenantDto {
  name: string;
  domain: string;
  adminEmail: string;
  plan: TenantPlan;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantDto {
  name?: string;
  domain?: string;
  logo?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
  adminEmail?: string;
  settings?: Partial<TenantSettings>;
}

export interface TenantListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus;
  plan?: TenantPlan;
  sortBy?: 'name' | 'createdAt' | 'userCount';
  sortOrder?: 'asc' | 'desc';
}

export const tenantService = {
  async list(params?: TenantListParams): Promise<TenantListResponse> {
    const response = await apiClient.get('/admin/tenants', { params });
    return response.data;
  },

  async get(id: string): Promise<Tenant> {
    const response = await apiClient.get(`/admin/tenants/${id}`);
    return response.data;
  },

  async create(data: CreateTenantDto): Promise<Tenant> {
    const response = await apiClient.post('/admin/tenants', data);
    return response.data;
  },

  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const response = await apiClient.patch(`/admin/tenants/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/tenants/${id}`);
  },

  async getStats(): Promise<TenantStats> {
    const response = await apiClient.get('/admin/tenants/stats');
    return response.data;
  },

  // Quick actions
  async suspend(id: string, reason?: string): Promise<Tenant> {
    const response = await apiClient.post(`/admin/tenants/${id}/suspend`, { reason });
    return response.data;
  },

  async activate(id: string): Promise<Tenant> {
    const response = await apiClient.post(`/admin/tenants/${id}/activate`);
    return response.data;
  },

  async changePlan(id: string, plan: TenantPlan): Promise<Tenant> {
    const response = await apiClient.patch(`/admin/tenants/${id}/plan`, { plan });
    return response.data;
  },

  async impersonate(id: string): Promise<{ token: string; redirectUrl: string }> {
    const response = await apiClient.post(`/admin/tenants/${id}/impersonate`);
    return response.data;
  },

  async extendTrial(id: string, days: number): Promise<Tenant> {
    const response = await apiClient.post(`/admin/tenants/${id}/extend-trial`, { days });
    return response.data;
  },

  // Users
  async getUsers(id: string): Promise<TenantUser[]> {
    const response = await apiClient.get(`/admin/tenants/${id}/users`);
    return response.data;
  },

  async updateUserRole(tenantId: string, userId: string, role: TenantUser['role']): Promise<TenantUser> {
    const response = await apiClient.patch(`/admin/tenants/${tenantId}/users/${userId}/role`, { role });
    return response.data;
  },

  async removeUser(tenantId: string, userId: string): Promise<void> {
    await apiClient.delete(`/admin/tenants/${tenantId}/users/${userId}`);
  },

  // API Keys
  async getApiKeys(id: string): Promise<TenantApiKey[]> {
    const response = await apiClient.get(`/admin/tenants/${id}/api-keys`);
    return response.data;
  },

  async createApiKey(id: string, data: { name: string; permissions: string[] }): Promise<TenantApiKey & { fullKey: string }> {
    const response = await apiClient.post(`/admin/tenants/${id}/api-keys`, data);
    return response.data;
  },

  async revokeApiKey(tenantId: string, keyId: string): Promise<void> {
    await apiClient.delete(`/admin/tenants/${tenantId}/api-keys/${keyId}`);
  },

  // Activity & Login History
  async getActivity(id: string, params?: { page?: number; limit?: number; type?: string }): Promise<{ data: TenantActivity[]; total: number }> {
    const response = await apiClient.get(`/admin/tenants/${id}/activity`, { params });
    return response.data;
  },

  async getLoginHistory(id: string, params?: { page?: number; limit?: number }): Promise<{ data: TenantLoginHistory[]; total: number }> {
    const response = await apiClient.get(`/admin/tenants/${id}/login-history`, { params });
    return response.data;
  },

  // Settings
  async updateSettings(id: string, settings: Partial<TenantSettings>): Promise<Tenant> {
    const response = await apiClient.patch(`/admin/tenants/${id}/settings`, settings);
    return response.data;
  },
};
