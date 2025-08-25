import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const baseConfig: NextConfig = {
  env: {
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  //   disable type cheking on build.
  },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "upload.wikimedia.org",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "rentalley-bucket.s3.ap-southeast-1.amazonaws.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "encrypted-tbn0.gstatic.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "mir-s3-cdn-cf.behance.net",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "rentahanbucket.s3.us-east-1.amazonaws.com",
                pathname: "/**",
            },
        ],
    },

};


const withPWA = nextPwa({
    dest: "public",
    register: true,
    sw: "firebase-messaging-sw.js",
});

// @ts-ignore
const nextConfig: NextConfig = withPWA(baseConfig);


export default nextConfig;
