import { google } from "googleapis";
import { GOOGLE_SHEETS } from "@/lib/config";

// ID da planilha de produtos
const SPREADSHEET_ID =
  GOOGLE_SHEETS.PRODUCT_SHEET_ID ||
  "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_NAME = GOOGLE_SHEETS.PRODUCT_ADD_TAB || "add"; // Nome da aba para adicionar produtos com imagens

// Função para adicionar o produto à aba "add" da planilha do Google (versão para o servidor)
export async function serverAddProductToAddTab(
  productName: string,
  imageUrl: string
): Promise<{
  success: boolean;
  message?: string;
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

    // Verificar se a aba existe
    try {
      console.log(`Servidor: Verificando se a aba ${SHEET_NAME} existe...`);
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      
      const sheetExists = spreadsheet.data.sheets?.some(
        (sheet) => sheet.properties?.title === SHEET_NAME
      );
      
      if (!sheetExists) {
        console.log(`Servidor: A aba ${SHEET_NAME} não existe. Criando...`);
        
        // Criar a aba se não existir
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: SHEET_NAME,
                  },
                },
              },
            ],
          },
        });
        
        // Adicionar cabeçalho
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1:B1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [["Nome do Produto", "URL da Imagem"]],
          },
        });
        
        console.log(`Servidor: Aba ${SHEET_NAME} criada com sucesso.`);
      }
    } catch (sheetError) {
      console.error("Servidor: Erro ao verificar/criar a aba:", sheetError);
      return {
        success: false,
        message: `Erro ao verificar/criar a aba ${SHEET_NAME}: ${String(sheetError)}`,
      };
    }

    // Preparar os dados para inserção
    const values = [[productName, imageUrl]];

    // Inserir os dados na planilha usando append
    try {
      console.log(`Servidor: Inserindo produto na aba ${SHEET_NAME}...`);
      
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:B`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: values,
        },
      });

      const updatedRange = appendResponse.data.updates?.updatedRange || "";
      console.log(`Servidor: Produto inserido com sucesso na aba ${SHEET_NAME}: ${updatedRange}`);

      return {
        success: true,
        message: `Produto adicionado com sucesso na aba ${SHEET_NAME}`,
      };
    } catch (error) {
      console.error(`Servidor: Erro ao inserir produto na aba ${SHEET_NAME}:`, error);
      return {
        success: false,
        message: `Erro ao adicionar produto na aba ${SHEET_NAME}: ${String(error)}`,
      };
    }
  } catch (error) {
    console.error("Servidor: Erro ao processar requisição:", error);
    return {
      success: false,
      message: `Erro interno do servidor: ${String(error)}`,
    };
  }
}
