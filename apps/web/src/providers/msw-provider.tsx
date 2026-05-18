'use client';

import { useEffect, useState } from 'react';

// Only starts MSW in development — production builds are unaffected
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') return;
  if (typeof window === 'undefined') return;

  const { worker } = await import('@/mocks/browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}

export function MswProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== 'development');

  useEffect(() => {
    void enableMocking().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
