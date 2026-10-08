import { ApiRequestError, type PaginatedResponse } from '@/services/apiTypes';
import { runMockRequest, type MockScenario } from '@/services/mockTransport';
import type { ClientNotification, NotificationSearchParams } from './types';

const notifications: readonly ClientNotification[] = [
  {
    id: 'N-0001',
    kind: 'activity',
    title: 'Activity completed',
    body: 'A fictional credit activity is complete.',
    createdAt: '2026-01-15T12:00:00.000Z',
    readAt: null
  },
  {
    id: 'N-0002',
    kind: 'account',
    title: 'Account snapshot ready',
    body: 'Your demo account snapshot is available.',
    createdAt: '2026-01-14T10:00:00.000Z',
    readAt: '2026-01-14T12:00:00.000Z'
  },
  {
    id: 'N-0003',
    kind: 'system',
    title: 'Portfolio demo notice',
    body: 'This experience uses only fictional local data.',
    createdAt: '2026-01-13T09:00:00.000Z',
    readAt: null
  },
  {
    id: 'N-0004',
    kind: 'activity',
    title: 'Activity pending',
    body: 'A fictional transfer is waiting in the demo timeline.',
    createdAt: '2026-01-12T08:00:00.000Z',
    readAt: null
  },
  {
    id: 'N-0005',
    kind: 'system',
    title: 'Demo data refreshed',
    body: 'The sample records are ready to explore.',
    createdAt: '2026-01-11T07:00:00.000Z',
    readAt: '2026-01-11T11:00:00.000Z'
  }
];

export async function listNotifications(
  params: NotificationSearchParams,
  signal: AbortSignal,
  scenario: MockScenario = 'normal'
): Promise<PaginatedResponse<ClientNotification>> {
  if (
    !Number.isInteger(params.page) ||
    params.page < 1 ||
    !Number.isInteger(params.pageSize) ||
    params.pageSize < 1
  ) {
    throw new ApiRequestError('VALIDATION_ERROR', 'Page and page size must be positive integers.');
  }
  await runMockRequest(signal, scenario);
  const filtered =
    scenario === 'empty'
      ? []
      : notifications.filter((item) => !params.kind || item.kind === params.kind);
  const start = (params.page - 1) * params.pageSize;
  return {
    data: filtered.slice(start, start + params.pageSize),
    page: params.page,
    pageSize: params.pageSize,
    total: filtered.length,
    updatedAt: '2026-01-15T12:00:00.000Z'
  };
}
