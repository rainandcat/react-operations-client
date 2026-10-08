import { useQuery } from '@tanstack/react-query';
import type { MockScenario } from '@/services/mockTransport';
import { retryMockQuery } from '@/services/queryRetry';
import { getAccountOverview } from './accountApi';

export function useAccountOverview(scenario: MockScenario) {
  return useQuery({
    queryKey: ['account-overview', scenario],
    queryFn: ({ signal }) => getAccountOverview(signal, scenario),
    retry: retryMockQuery,
    retryDelay: 0
  });
}
