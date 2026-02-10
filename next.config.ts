
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // CRITICAL: output: 'export' must remain removed to allow Server Actions & AI on Netlify/Vercel
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.ibb.co.com' }
    ],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        async_hooks: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
