/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Remote images that Next.js is allowed to optimize
    remotePatterns: [
      // Unsplash (your test image domain)
      { protocol: 'https', hostname: 'images.unsplash.com' },

      // Supabase Storage (covers your project, e.g. abcd1234.supabase.co)
      { protocol: 'https', hostname: '**.supabase.co' },

      // If you use any other hosts, add them here, e.g.:
      // { protocol: 'https', hostname: 'plus.unsplash.com' },
      // { protocol: 'https', hostname: 'images.pexels.com' },
      // { protocol: 'https', hostname: 'cdn.pixabay.com' },
      // { protocol: 'https', hostname: 'your-cdn.example.com' },
    ],
  },
};

export default nextConfig;
