import type { NextConfig } from "next";
import withPWA from 'next-pwa';

// exclude any server-only manifest files from precache
const pwa = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development for easier debugging
  register: true,
  skipWaiting: true,
  buildExcludes: [
    /app-build-manifest\.json$/,
    /middleware-manifest\.json$/,
  ],
  dynamicStartUrl: false,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default pwa(nextConfig);
