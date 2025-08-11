/**
 * Configurações centralizadas da aplicação
 */

// Informações da aplicação
export const APP_NAME = "Gerador de Encartes";
export const APP_DESCRIPTION = "Gerador de encartes para o Atacado Léia";

// Configurações do Google Sheets
export const GOOGLE_SHEETS = {
  // Planilha de produtos
  PRODUCT_SHEET_ID:
    process.env.SPREADSHEET_PRODUTOS_ID ||
    "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w",
  PRODUCT_SHEET_TAB: "produtos",
  PRODUCT_ADD_TAB: "add", // Nova aba para adicionar produtos com imagens

  // Planilha de saída (encartes)
  OUTPUT_SHEET_ID:
    process.env.SPREADSHEET_ID ||
    "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8",
  OUTPUT_SHEET_TAB: "finaldesemana",
};

// Configurações do Supabase
export const SUPABASE = {
  BUCKET_NAME: "imagens",
  PROJECT_ID: "zqeypptzvwelnlkqbcco",
};

// Configurações de formulários
export const FORM_CONFIG = {
  // Número inicial de produtos por tipo de encarte
  INITIAL_PRODUCT_COUNT: {
    FIM_DE_SEMANA: 60,
    CARNES: 12,
    HORTI_FRUTI: 12,
  },

  // Tipos de promoção
  PROMO_TYPES: {
    COMPRANDO: "comprando",
    LIMITE: "limite",
  },
};

// Rotas da aplicação
export const ROUTES = {
  HOME: "/",
  CARNES: "/especial-das-carnes",
  HORTI_FRUTI: "/ofertas-horti-fruti",
  UPLOAD_IMAGES: "/upload-de-imagens",
};

// Mensagens de erro comuns
export const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: "Produto não encontrado",
  FAILED_TO_LOAD_PRODUCTS:
    "Não foi possível carregar a lista de produtos da planilha.",
  FAILED_TO_UPLOAD_IMAGE:
    "Ocorreu um erro ao fazer upload da imagem. Por favor, tente novamente.",
};

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  FORM_SUBMITTED: "Formulário enviado com sucesso!",
  IMAGE_UPLOADED: "Imagem enviada com sucesso!",
};
