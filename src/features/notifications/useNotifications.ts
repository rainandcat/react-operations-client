import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { MockScenario } from '@/services/mockTransport';
import { retryMockQuery } from '@/services/queryRetry';
import { listNotifications } from './notificationApi';
import type { NotificationSearchParams } from './types';

export function useNotifications(params: NotificationSearchParams, scenario: MockScenario) {
  return useQuery({
    queryKey: ['notifications', params.kind ?? 'all', params.page, params.pageSize, scenario],
    queryFn: ({ signal }) => listNotifications(params, signal, scenario),
    placeholderData: keepPreviousData,
    retry: retryMockQuery,
    retryDelay: 0
  });
}
