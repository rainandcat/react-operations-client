import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { MockScenario } from '@/services/mockTransport';
import { listActivities } from './activityApi';
import type { ActivitySearchParams } from './types';

export function useActivities(params: ActivitySearchParams, scenario: MockScenario) {
  return useQuery({
    queryKey: ['activities', params.kind ?? 'all', params.page, params.pageSize, scenario],
    queryFn: ({ signal }) => listActivities(params, signal, scenario),
    placeholderData: keepPreviousData,
    retry: false
  });
}
