import { NextResponse } from "next/server";
import { google } from "googleapis";
import { GOOGLE_SHEETS } from "@/lib/config";

// ID da planilha de produtos
const SPREADSHEET_ID =
  GOOGLE_SHEETS.PRODUCT_SHEET_ID ||
  "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_NAME = GOOGLE_SHEETS.PRODUCT_ADD_TAB || "add"; // Nome da aba para adicionar produtos com imagens

// Função para escrever "OLÁ MUNDO" na célula A1 da aba "add"
export async function GET(request: Request) {
  try {
    console.log(`Tentando escrever "OLÁ MUNDO" na célula A1 da aba ${SHEET_NAME}...`);
    
    // Carregar as credenciais da conta de serviço
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Inicializar a API do Google Sheets
    const sheets = google.sheets({ version: "v4", auth });

    // Verificar se a aba existe
    try {
      console.log(`Verificando se a aba ${SHEET_NAME} existe...`);
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        (sheet) => sheet.properties?.title === SHEET_NAME
      );

      if (!sheetExists) {
        console.log(`A aba ${SHEET_NAME} não existe. Criando...`);
        
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
        
        console.log(`Aba ${SHEET_NAME} criada com sucesso.`);
      }
    } catch (sheetError) {
      console.error("Erro ao verificar/criar a aba:", sheetError);
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao verificar/criar a aba ${SHEET_NAME}`,
          error: String(sheetError),
        },
        { status: 500 }
      );
    }

    // Escrever "OLÁ MUNDO" na célula A1
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["OLÁ MUNDO"]],
      },
    });

    const updatedCells = result.data.updatedCells || 0;
    console.log(`Escrito "OLÁ MUNDO" na célula A1 com sucesso: ${updatedCells} células atualizadas`);

    return NextResponse.json({
      success: true,
      message: `Escrito "OLÁ MUNDO" na célula A1 da aba ${SHEET_NAME} com sucesso!`,
      updatedCells,
    });
  } catch (error) {
    console.error("Erro ao escrever na planilha:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao escrever na planilha",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
