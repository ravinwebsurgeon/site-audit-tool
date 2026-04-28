import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'bullmq', 'ioredis', 'nodemailer', '@aws-sdk/client-s3',
    '@prisma/adapter-pg', 'pg',
  ],
  // Prisma 7 generates a WASM query-compiler binary that Vercel's file-tracer
  // won't pick up automatically from a non-standard output path.
  outputFileTracingIncludes: {
    '**': ['./app/generated/prisma/**/*.wasm'],
  },
};

export default nextConfig;
