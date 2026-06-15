/** @type {import('next').NextConfig} */
const nextConfig = {
  // Plain <img> is used (mix-blend-mode etc.), so next/image optimization is off by design.
  serverExternalPackages: ["sharp"], // native module — don't bundle, load at runtime
  experimental: {
    // Product image uploads go through server actions; bump the body limit.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
