import { type ApiResponse } from '@/services/apiTypes';
import { runMockRequest, type MockScenario } from '@/services/mockTransport';
import type { AccountOverview } from './types';

const overview: AccountOverview = {
  accountId: 'AC-0001',
  displayName: 'Alex Morgan',
  totalBalance: '128.40',
  currencyCode: 'USD',
  updatedAt: '2026-01-15T12:00:00.000Z'
};

export async function getAccountOverview(
  signal: AbortSignal,
  scenario: MockScenario = 'normal'
): Promise<ApiResponse<AccountOverview | null>> {
  await runMockRequest(signal, scenario);
  return { data: scenario === 'empty' ? null : overview, updatedAt: overview.updatedAt };
}
