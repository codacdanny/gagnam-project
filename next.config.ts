import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the repo clean for review - no generated agent-instruction files.
  agentRules: false,
};

export default nextConfig;
