/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'SUVIDHA ONE',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
};

export default nextConfig;
