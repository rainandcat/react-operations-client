import { createContext, useContext, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MarketApi } from './marketApi';

const MarketContext = createContext<MarketApi | null>(null);
export function MarketProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [api] = useState(() => new MarketApi(queryClient));
  return <MarketContext.Provider value={api}>{children}</MarketContext.Provider>;
}
export function useMarketApi() {
  const api = useContext(MarketContext);
  if (!api) throw new Error('MarketProvider is required.');
  return api;
}
