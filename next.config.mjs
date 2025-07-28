/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Node.js runtime instead of Edge for better MongoDB compatibility
  serverExternalPackages: ['mongoose']
};

export default nextConfig;
