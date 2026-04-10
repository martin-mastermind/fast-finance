/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // Note: headers() is not supported with output: 'export' (static HTML).
  // Security headers must be configured at the CDN/hosting layer (e.g., Render headers config).
  // Required headers for production:
  //   X-Content-Type-Options: nosniff
  //   X-Frame-Options: DENY
  //   X-XSS-Protection: 1; mode=block
  //   Referrer-Policy: strict-origin-when-cross-origin
  //   Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  //   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; ...
}

export default nextConfig
