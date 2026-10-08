import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { MockScenario } from '@/services/mockTransport';
import { retryMockQuery } from '@/services/queryRetry';
import { getActivity, listActivities } from './activityApi';
import type { ActivitySearchParams } from './types';

export function useActivities(params: ActivitySearchParams, scenario: MockScenario) {
  return useQuery({
    queryKey: [
      'activities',
      params.kind ?? 'all',
      params.sort,
      params.page,
      params.pageSize,
      scenario
    ],
    queryFn: ({ signal }) => listActivities(params, signal, scenario),
    placeholderData: keepPreviousData,
    retry: retryMockQuery,
    retryDelay: 0
  });
}

export function useActivity(activityId: string) {
  return useQuery({
    queryKey: ['activity', activityId],
    queryFn: ({ signal }) => getActivity(activityId, signal),
    enabled: Boolean(activityId),
    retry: retryMockQuery,
    retryDelay: 0
  });
}
