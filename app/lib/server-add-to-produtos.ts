import { google } from "googleapis";
import { GOOGLE_SHEETS } from "@/lib/config";

// ID da planilha de produtos
const SPREADSHEET_ID =
  GOOGLE_SHEETS.PRODUCT_SHEET_ID ||
  "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_NAME = "produtos"; // Nome da aba para produtos

// Função para adicionar o produto à aba "produtos" da planilha do Google (versão para o servidor)
export async function serverAddProductToProdutos(
  productName: string,
  imageUrl: string
): Promise<{
  success: boolean;
  message?: string;
  updatedRange?: string;
}> {
  try {
    console.log(`Servidor: Adicionando produto à aba ${SHEET_NAME}...`);
    console.log(`Servidor: Nome do produto: ${productName}`);
    console.log(`Servidor: URL da imagem: ${imageUrl.substring(0, 50)}...`);

    // Configurar autenticação com o Google Sheets
    // Formatar a chave privada corretamente
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
    // Remover as aspas do início e do fim se existirem
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Substituir \n por quebras de linha reais
    privateKey = privateKey.replace(/\\n/g, "\n");

    // Criar cliente JWT para autenticação
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Criar cliente do Google Sheets
    const sheets = google.sheets({ version: "v4", auth });

    // Verificar se a aba existe e obter a próxima linha vazia
    try {
      console.log(`Servidor: Verificando a aba ${SHEET_NAME} e obtendo a próxima linha vazia...`);
      
      // Obter os dados existentes para encontrar a próxima linha vazia
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:B`,
      });

      const values = response.data.values || [];
      const nextRow = values.length + 1;

      console.log(`Servidor: Próxima linha vazia: ${nextRow}`);

      // Verificar se o produto já existe na planilha
      const existingProducts = values.map((row: any[]) => 
        row[0] ? row[0].toString().toLowerCase().trim() : ""
      );
      
      if (existingProducts.includes(productName.toLowerCase().trim())) {
        console.log(`Servidor: Produto "${productName}" já existe na planilha.`);
        return {
          success: false,
          message: "Não adicionado. Produto já existe na planilha",
        };
      }

      // Preparar os dados para inserção
      const productData = [[productName, imageUrl]];

      // Inserir os dados na planilha usando append
      console.log(`Servidor: Inserindo produto na linha ${nextRow}...`);
      
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${nextRow}`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: productData,
        },
      });

      const updatedRange = appendResponse.data.updates?.updatedRange || "";
      console.log(`Servidor: Produto inserido com sucesso na aba ${SHEET_NAME}: ${updatedRange}`);

      return {
        success: true,
        message: `Produto adicionado com sucesso à aba ${SHEET_NAME}`,
        updatedRange,
      };
    } catch (error) {
      console.error(`Servidor: Erro ao inserir produto na aba ${SHEET_NAME}:`, error);
      
      // Tentar método alternativo com update se o append falhar
      try {
        console.log("Servidor: Tentando método alternativo com update...");
        
        // Obter os dados existentes novamente para garantir a linha correta
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A:B`,
        });

        const values = response.data.values || [];
        const nextRow = values.length + 1;
        
        // Preparar os dados para inserção
        const productData = [[productName, imageUrl]];
        
        // Usar update em vez de append
        const updateResponse = await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A${nextRow}:B${nextRow}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: productData,
          },
        });

        const updatedCells = updateResponse.data.updatedCells || 0;
        console.log(`Servidor: Produto inserido com sucesso usando update: ${updatedCells} células atualizadas`);

        return {
          success: true,
          message: `Produto adicionado com sucesso à aba ${SHEET_NAME} usando método alternativo`,
          updatedRange: `${SHEET_NAME}!A${nextRow}:B${nextRow}`,
        };
      } catch (updateError) {
        console.error("Servidor: Erro no método alternativo:", updateError);
        return {
          success: false,
          message: `Erro ao adicionar produto à aba ${SHEET_NAME}: ${String(error)}`,
        };
      }
    }
  } catch (error) {
    console.error("Servidor: Erro ao processar requisição:", error);
    return {
      success: false,
      message: `Erro interno do servidor: ${String(error)}`,
    };
  }
}
