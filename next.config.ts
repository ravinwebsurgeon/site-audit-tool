import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bullmq', 'ioredis', 'nodemailer', '@aws-sdk/client-s3'],
};

export default nextConfig;
