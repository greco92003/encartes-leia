/** @type {import(\"next\").NextConfig} */
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

  // Configuração para o diretório de origem
  distDir: ".next",

  // Configuração para o diretório de páginas
  pageExtensions: ["tsx", "ts", "jsx", "js"],

  // Configuração para resolver o problema de OpenSSL
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, "canvas", "jsdom"];
    }

    // Adicionar opção para resolver o problema ERR_OSSL_UNSUPPORTED
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    };

    return config;
  },
};

module.exports = nextConfig;
