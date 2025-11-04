export interface NotificationRecord {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}
