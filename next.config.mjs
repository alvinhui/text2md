/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/md2rt.html", destination: "/md2rt", permanent: true },
      { source: "/rt2md.html", destination: "/rt2md", permanent: true },
      { source: "/wx2md.html", destination: "/wx2md", permanent: true },
    ];
  },
};

export default nextConfig;
