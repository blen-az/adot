import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async redirects() {
    return [{ source: "/", destination: "/en", permanent: false }];
  },
};

export default config;
