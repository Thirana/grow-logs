'use client';

import { useInView } from '@/hooks/use-in-view';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
}

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  const [ref, isInView] = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0px)' : 'translateY(24px)',
        transition: `opacity 560ms ease-out ${delay}ms, transform 560ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
