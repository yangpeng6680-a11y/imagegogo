/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/imagegogo",
  distDir: "docs",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;