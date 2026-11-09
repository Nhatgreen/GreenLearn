import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined
  ? process.env.NEXT_PUBLIC_BASE_PATH
  : (isGithubPages ? "/GreenLearn" : "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["lucide-react"],
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  ...(isGithubPages ? {
    output: "export",
    basePath: configuredBasePath,
    images: {
      unoptimized: true,
    },
  } : {}),
};

export default nextConfig;
