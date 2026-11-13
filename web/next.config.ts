import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["bpmn-js", "bpmn-moddle", "bpmn-auto-layout", "bpmn-js-token-simulation"],
};

export default nextConfig;

