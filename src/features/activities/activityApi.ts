import { ApiRequestError, type PaginatedResponse } from '@/services/apiTypes';
import {
  requireMockService,
  waitForMockResponse,
  type MockScenario
} from '@/services/mockTransport';
import type { ActivitySearchParams, ClientActivity } from './types';

const activities: readonly ClientActivity[] = [
  {
    id: 'A-0001',
    kind: 'credit',
    status: 'completed',
    amount: '42.00',
    currencyCode: 'USD',
    occurredAt: '2026-01-15T12:00:00.000Z'
  },
  {
    id: 'A-0002',
    kind: 'transfer',
    status: 'pending',
    amount: '18.50',
    currencyCode: 'USD',
    occurredAt: '2026-01-14T09:00:00.000Z'
  },
  {
    id: 'A-0003',
    kind: 'debit',
    status: 'completed',
    amount: '7.25',
    currencyCode: 'USD',
    occurredAt: '2026-01-13T15:30:00.000Z'
  },
  {
    id: 'A-0004',
    kind: 'transfer',
    status: 'declined',
    amount: '60.00',
    currencyCode: 'USD',
    occurredAt: '2026-01-12T11:45:00.000Z'
  },
  {
    id: 'A-0005',
    kind: 'credit',
    status: 'completed',
    amount: '25.00',
    currencyCode: 'USD',
    occurredAt: '2026-01-11T08:15:00.000Z'
  },
  {
    id: 'A-0006',
    kind: 'debit',
    status: 'completed',
    amount: '14.80',
    currencyCode: 'USD',
    occurredAt: '2026-01-10T13:20:00.000Z'
  },
  {
    id: 'A-0007',
    kind: 'credit',
    status: 'pending',
    amount: '9.00',
    currencyCode: 'USD',
    occurredAt: '2026-01-09T10:05:00.000Z'
  },
  {
    id: 'A-0008',
    kind: 'transfer',
    status: 'completed',
    amount: '31.75',
    currencyCode: 'USD',
    occurredAt: '2026-01-08T16:40:00.000Z'
  }
];

export async function listActivities(
  params: ActivitySearchParams,
  signal: AbortSignal,
  scenario: MockScenario = 'normal'
): Promise<PaginatedResponse<ClientActivity>> {
  if (
    !Number.isInteger(params.page) ||
    params.page < 1 ||
    !Number.isInteger(params.pageSize) ||
    params.pageSize < 1
  ) {
    throw new ApiRequestError('VALIDATION_ERROR', 'Page and page size must be positive integers.');
  }

  await waitForMockResponse(signal);
  requireMockService(scenario);

  const filtered =
    scenario === 'empty'
      ? []
      : activities.filter((activity) => !params.kind || activity.kind === params.kind);
  const start = (params.page - 1) * params.pageSize;
  return {
    data: filtered.slice(start, start + params.pageSize),
    page: params.page,
    pageSize: params.pageSize,
    total: filtered.length,
    updatedAt: '2026-01-15T12:00:00.000Z'
  };
}
