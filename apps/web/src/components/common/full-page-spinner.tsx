// Full-viewport loading spinner — shown while the auth guard checks session state on first render.
// Used by: components/common/auth-guard.tsx
import { type JSX } from 'react';
import { Loader2 } from 'lucide-react';

export function FullPageSpinner(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="text-gl-primary size-8 animate-spin" />
    </div>
  );
}
