/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://your-worker-name.your-subdomain.workers.dev'
      : 'http://localhost:5000'
  }
}

module.exports = nextConfig
