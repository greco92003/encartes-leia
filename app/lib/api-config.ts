/**
 * Configuração de URLs da API
 * Este arquivo centraliza a configuração de URLs da API para facilitar a manutenção
 */

// Determina se estamos em ambiente de desenvolvimento ou produção
const isDevelopment =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// URL base da API
export const API_BASE_URL = isDevelopment
  ? "" // URL relativa para desenvolvimento local
  : ""; // URL relativa para produção (pode ser alterada se necessário)

// URLs específicas da API
export const API_ENDPOINTS = {
  ADD_PRODUCT_TO_SHEET: `${API_BASE_URL}/api/add-product-to-sheet`,
  ADD_PRODUCT_TO_ADD_TAB: `${API_BASE_URL}/api/add-product-to-add-tab`,
  ADD_TO_ADD_TAB: `${API_BASE_URL}/api/add-to-add-tab`,
  ADD_TO_PRODUTOS_TAB: `${API_BASE_URL}/api/add-to-produtos-tab`,
  GOOGLE_PRODUCTS: `${API_BASE_URL}/api/google-products`,
  CREATE_PRODUCTS: `${API_BASE_URL}/api/create-products`,
  SUBMIT: `${API_BASE_URL}/api/submit`,
  SYNC_PENDING_PRODUCTS: `${API_BASE_URL}/api/sync-pending-products`,
  SYNC_TO_ADD_TAB: `${API_BASE_URL}/api/sync-to-add-tab`,
};

/**
 * Função para obter a URL completa de um endpoint da API
 * @param endpoint Nome do endpoint ou URL relativa
 * @returns URL completa do endpoint
 */
export function getApiUrl(endpoint: string): string {
  // Se o endpoint já estiver no objeto API_ENDPOINTS, retornar a URL correspondente
  if (endpoint in API_ENDPOINTS) {
    return API_ENDPOINTS[endpoint as keyof typeof API_ENDPOINTS];
  }

  // Se o endpoint começar com '/', assumir que é uma URL relativa
  if (endpoint.startsWith("/")) {
    return `${API_BASE_URL}${endpoint}`;
  }

  // Caso contrário, assumir que é uma URL relativa sem a barra inicial
  return `${API_BASE_URL}/${endpoint}`;
}
