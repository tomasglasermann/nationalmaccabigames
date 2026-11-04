/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve the static multi-page site from /public. Clean root URL -> home.html;
  // other pages are served at their own .html paths.
  async rewrites() {
    return [{ source: '/', destination: '/home.html' }];
  },
};

module.exports = nextConfig;
