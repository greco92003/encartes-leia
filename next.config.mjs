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
  // Configuração para resolver o problema de 404
  output: "standalone",

  // Desativar a verificação de ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Desativar a verificação de tipos TypeScript durante o build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuração para redirecionar para o diretório app
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/app/:path*',
      },
    ];
  },
};

export default nextConfig;
