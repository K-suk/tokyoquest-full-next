import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 既存のドメインに加え、ピクセル指定パスのみを許可
    domains: [
      "lh3.googleusercontent.com",
      "picsum.photos",
      "images.unsplash.com",
      "unsplash.com",
      "plus.unsplash.com",
      "photos.app.goo.gl",
      "photos.fife.usercontent.google.com",
      "*.supabase.co",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        // /seed/<任意文字列>/<幅>/<高さ> や /<幅>/<高さ> など、必要なパターンのみ
        pathname: "/seed/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "photos.app.goo.gl",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "photos.fife.usercontent.google.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
    // 開発時のみ最適化をオフ
    unoptimized: process.env.NODE_ENV === "development",
    // SVG は厳格に制御したい場合は false に
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; sandbox;",
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // 画像は picsum.photos と Unsplash と Google Photos と Supabase Storage を許可
              "img-src 'self' data: https://lh3.googleusercontent.com https://picsum.photos https://images.unsplash.com https://unsplash.com https://plus.unsplash.com https://photos.app.goo.gl https://photos.fife.usercontent.google.com https://*.supabase.co",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' /api/miasanmia_admin/quests/*/image",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXTAUTH_URL || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
      {
        source: "/api/miasanmia_admin/quests/(.*)/image",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/uploads/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self'",
              "img-src 'self' data:",
              "font-src 'self' data:",
              "connect-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
