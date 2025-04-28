/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para permitir imagens de domínios externos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zqeypptzvwelnlkqbcco.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
