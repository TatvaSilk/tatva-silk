/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add every remote domain you will load images from
    remotePatterns: [
      // Unsplash (your test image)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Supabase Storage public bucket (replace with your actual project ref)
      // You can find the "project-ref" in your Supabase project URL.
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      // If you plan to store images elsewhere, add the domains here
      // { protocol: 'https', hostname: 'your-cdn.example.com' },
    ],
  },
};

module.exports = nextConfig;
