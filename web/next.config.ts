import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  agentRules: false,
  output: "standalone",
  async redirects() {
    return [
      { source: "/docs", destination: "/docs/index.html", permanent: false },
      { source: "/docs/", destination: "/docs/index.html", permanent: false },
      { source: "/docs/fr", destination: "/docs/fr/index.html", permanent: false },
      { source: "/docs/fr/", destination: "/docs/fr/index.html", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
