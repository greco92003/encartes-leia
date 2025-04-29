import { NextResponse } from "next/server";
import { google } from "googleapis";

// Configuração da API do Google Sheets
const SHEET_ID = "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_TAB = "produtos"; // Nome da aba onde estão os produtos

// Função para escrever "ola mundo" na célula A1049
export async function GET(request: Request) {
  try {
    // Inicializar o cliente JWT com as credenciais da conta de serviço
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Inicializar a API do Google Sheets
    const sheets = google.sheets({ version: "v4", auth });

    // Escrever "ola mundo" na célula A1049
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1049`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["ola mundo"]],
      },
    });

    return NextResponse.json({
      message: "Escrito 'ola mundo' na célula A1049 com sucesso",
    });
  } catch (error) {
    console.error("Erro ao escrever na planilha:", error);
    return NextResponse.json(
      { message: `Erro ao escrever na planilha: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}
