import { withWhopAppConfig } from "@whop/react/next.config";
import type { NextConfig } from "next";

const PLACEHOLDER_APP_ID = "placeholder_whop_app_id";

if (!process.env.NEXT_PUBLIC_WHOP_APP_ID) {
	process.env.NEXT_PUBLIC_WHOP_APP_ID = PLACEHOLDER_APP_ID;
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{ hostname: "**" }],
  },
  turbopack: {
    root: process.cwd(),
  },
  // Increase body size limit for video uploads (50MB) and cache control
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

const hasWhopApp = Boolean(process.env.NEXT_PUBLIC_WHOP_APP_ID);

const config = hasWhopApp ? withWhopAppConfig(nextConfig) : nextConfig;

export default config;
