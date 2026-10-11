import { initializeLocale } from '@/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '@/app/App';
import { MarketProvider } from '@/features/markets/MarketProvider';
import '@/styles/global.css';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000
    }
  }
});
async function start() {
  await initializeLocale();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MarketProvider>
          <App />
        </MarketProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
void start().catch(() => {
  const root = document.getElementById('root')!;
  root.textContent = 'Could not load the language. ';
  const button = document.createElement('button');
  button.textContent = 'Try again';
  button.onclick = () => window.location.reload();
  root.append(button);
});
