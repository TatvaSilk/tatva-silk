/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Unsplash (your test image domain)
      { protocol: 'https', hostname: 'images.unsplash.com' },

      // Supabase Storage (replace `YOUR-PROJECT-REF` with your real project ref)
      // Find it in your Supabase project URL: https://YOUR-PROJECT-REF.supabase.co
      { protocol: 'https', hostname: 'YOUR-PROJECT-REF.supabase.co' },

      // If you use any other image host/CDN, add it here too.
      // { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
};

export default nextConfig;
