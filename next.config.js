/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve the static landing page (public/landing.html) at the site root,
  // keeping the URL as "/". All its inline CSS/JS run normally.
  async rewrites() {
    return [{ source: '/', destination: '/landing.html' }];
  },
};

module.exports = nextConfig;
