declare module 'next-pwa' {
  import { NextConfig } from 'next';
  import { NextPWAPluginOptions } from 'next-pwa';
  const withPWA: (options: NextPWAPluginOptions) => (config: NextConfig) => NextConfig;
  export default withPWA;
} 