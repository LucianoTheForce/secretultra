import type { NextConfig } from "next";

function imageKitRemotePattern() {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return null;

  try {
    const parsed = new URL(endpoint);
    const protocol = parsed.protocol.replace(":", "") as "http" | "https";
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return {
      protocol: protocol as "https",  // Cast to "https" for type compatibility
      hostname: parsed.hostname,
      pathname: `${pathname.length > 0 ? pathname : ''}/**` || "/**",
    };
  } catch (error) {
    console.warn("[next.config] Failed to parse IMAGEKIT_URL_ENDPOINT", error);
    return null;
  }
}

const remotePatterns: Array<{
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
}> = [
  {
    protocol: "https",
    hostname: "ik.imagekit.io",
    pathname: "/**",
  },
];

const dynamicPattern = imageKitRemotePattern();
if (dynamicPattern && remotePatterns) {
  const exists = remotePatterns.some(
    (pattern) =>
      pattern.hostname === dynamicPattern.hostname &&
      pattern.protocol === dynamicPattern.protocol &&
      pattern.pathname === dynamicPattern.pathname,
  );

  if (!exists) {
    remotePatterns.push(dynamicPattern);
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
