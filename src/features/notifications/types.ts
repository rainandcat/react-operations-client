export type NotificationKind = 'activity' | 'account' | 'system';

export interface ClientNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationSearchParams {
  kind?: NotificationKind;
  page: number;
  pageSize: number;
}
