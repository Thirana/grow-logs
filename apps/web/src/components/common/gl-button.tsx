import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const glButtonVariants = cva(
  [
    'inline-flex items-center justify-center font-semibold whitespace-nowrap',
    'cursor-pointer select-none tracking-[-0.005em]',
    'transition-all duration-[120ms] ease-out',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        primary: ['bg-gl-primary/[0.16] text-gl-primary', 'hover:bg-gl-primary/[0.24]'],
        secondary: ['bg-gl-text/[0.06] text-gl-text', 'hover:bg-gl-text/[0.10]'],
        ghost: ['bg-transparent text-gl-text-muted', 'hover:bg-gl-text/[0.05] hover:text-gl-text'],
      },
      size: {
        sm: 'gap-1.5 rounded-lg px-3 py-1.5 text-[13px]',
        md: 'gap-2 rounded-lg px-3.5 py-[9px] text-[14px]',
        lg: 'gap-2.5 rounded-[10px] px-[22px] py-[13px] text-[15px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface GlButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glButtonVariants> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export function GlButton({
  className,
  variant,
  size,
  leading,
  trailing,
  children,
  ...props
}: GlButtonProps) {
  return (
    <button className={cn(glButtonVariants({ variant, size }), className)} {...props}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}

export { glButtonVariants };
