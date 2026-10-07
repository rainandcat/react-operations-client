import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DemoClientSession } from './demoAuth';

interface ClientSessionState {
  session: DemoClientSession | null;
  signIn: (session: DemoClientSession) => void;
  signOut: () => void;
}

export const useClientSession = create<ClientSessionState>()(
  persist(
    (set) => ({
      session: null,
      signIn: (session) => set({ session }),
      signOut: () => set({ session: null })
    }),
    {
      name: 'operations-client-demo-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session })
    }
  )
);
