import { NextResponse } from "next/server";
import { google } from "googleapis";

// ID da planilha de encarte
const SPREADSHEET_ID = "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";
const SHEET_NAME = "finaldesemana"; // Nome correto da aba da planilha

export async function GET(request: Request) {
  try {
    console.log("Iniciando teste de escrita na planilha...");

    // Formatar a chave privada corretamente
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
    // Remover as aspas do início e do fim se existirem
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Substituir \n por quebras de linha reais
    privateKey = privateKey.replace(/\\n/g, "\n");

    console.log(
      "Email da conta de serviço:",
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    );
    console.log("ID da planilha:", SPREADSHEET_ID);
    console.log(
      "Chave privada formatada (primeiros 20 caracteres):",
      privateKey.substring(0, 20) + "..."
    );

    try {
      // Autenticar com o Google Sheets API
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth });

      // Teste simples para verificar a autenticação
      console.log("Tentando acessar a planilha...");
      const testResponse = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      console.log(
        "Acesso à planilha bem-sucedido. Título:",
        testResponse.data.properties?.title
      );

      // Obter informações sobre as abas da planilha
      console.log("Obtendo informações sobre as abas da planilha...");
      const sheets_info = testResponse.data.sheets || [];
      const sheet_names = sheets_info.map(
        (sheet: any) => sheet.properties?.title
      );
      console.log("Abas disponíveis:", sheet_names);

      // Usar a primeira aba disponível
      const first_sheet = sheet_names[0] || "Sheet1";
      console.log(`Usando a aba: ${first_sheet}`);

      // Escrever "olá mundo" na célula A62
      console.log(
        `Escrevendo 'olá mundo' na célula A62 da aba ${first_sheet}...`
      );
      const response = await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${first_sheet}!A62`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["olá mundo"]],
        },
      });

      console.log(
        `Célula atualizada com sucesso: ${response.data.updatedCells} células atualizadas`
      );

      return NextResponse.json({
        success: true,
        message: "Teste de escrita na planilha concluído com sucesso",
        details: {
          updatedCells: response.data.updatedCells,
          updatedRange: response.data.updatedRange,
        },
      });
    } catch (error: any) {
      console.error("Erro ao acessar a planilha:", error.message);
      console.error("Detalhes do erro:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Erro ao acessar a planilha",
          error: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erro geral:", error.message);
    return NextResponse.json(
      { success: false, message: "Erro geral", error: error.message },
      { status: 500 }
    );
  }
}
