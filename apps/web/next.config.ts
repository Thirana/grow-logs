import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Catches subtle bugs that only appear in StrictMode (double-invoked effects,
  // deprecated API usage). Required for any production-quality React app.
  reactStrictMode: true,

  // Drop the X-Powered-By response header — no reason to advertise the stack.
  poweredByHeader: false,

  // Type-safe <Link href="..."> — the TypeScript compiler errors if you link to
  // a route that does not exist. Prevents dead links from ever being committed.
  experimental: {
    typedRoutes: true,
  },

  compiler: {
    // Strip all console.log calls in production builds. console.error and
    // console.warn are preserved so error boundaries and warnings still surface.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
