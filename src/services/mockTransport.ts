import { ApiRequestError } from './apiTypes';

export type MockScenario = 'normal' | 'empty' | 'unavailable';

export function waitForMockResponse(signal: AbortSignal, delayMs = 350): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('Request cancelled', 'AbortError'));
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);

    function onAbort() {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason ?? new DOMException('Request cancelled', 'AbortError'));
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function requireMockService(scenario: MockScenario): void {
  if (scenario === 'unavailable') {
    throw new ApiRequestError('UNAVAILABLE', 'The fictional data service is unavailable.', true);
  }
}

export function toApiRequestError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) return error;
  return new ApiRequestError('UNAVAILABLE', 'An unexpected demo service error occurred.', true);
}

export async function runMockRequest(
  signal: AbortSignal,
  scenario: MockScenario = 'normal'
): Promise<void> {
  try {
    await waitForMockResponse(signal);
    requireMockService(scenario);
  } catch (error) {
    if (signal.aborted) throw error;
    throw toApiRequestError(error);
  }
}
