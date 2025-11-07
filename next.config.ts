import { withWhopAppConfig } from "@whop/react/next.config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{ hostname: "**" }],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default withWhopAppConfig(nextConfig);
