import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Deterministic swatch variable for a category ID — maps into --gl-swatch-1 through --gl-swatch-5.
export function getCategorySwatchVar(categoryId: string): string {
  const hash = categoryId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `var(--gl-swatch-${(hash % 5) + 1})`;
}

// Returns the first message from the API error envelope, or a generic fallback.
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
