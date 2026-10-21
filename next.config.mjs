/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Send visitors using links from the old GoDaddy site to the matching new pages.
  async redirects() {
    const old = [
      ["/about-rihoso", "/about"],
      ["/about-us", "/about"],
      ["/events-and-gatherings", "/events"],
      ["/events-%26-gatherings", "/events"],
      ["/membership", "/memberships"],
      ["/join-now", "/memberships#join"],
      ["/join", "/memberships#join"],
      ["/contact-us", "/contact"],
      ["/sponsors-and-supporters", "/sponsors"],
      ["/sponsors-%26-supporters", "/sponsors"],
      ["/blogs", "/blog"],
      ["/watchmaking-school", "/watchmaking-schools"],
      ["/schools", "/watchmaking-schools"],
    ];
    return old.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
