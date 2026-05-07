import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DETECTION_API_URL: process.env.DETECTION_API_URL,
  },
  serverExternalPackages: ["@gradio/client"],
};

export default nextConfig;
