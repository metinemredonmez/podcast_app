import { NotificationType } from '../../../common/enums/prisma.enums';

export interface NotificationJobPayload {
  tenantId: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}
