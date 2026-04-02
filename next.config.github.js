/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/imagegogo",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
