import { NextResponse } from "next/server";
import { google } from "googleapis";

// ID da planilha de encarte
const SPREADSHEET_ID = "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";
const SHEET_NAME = "Página1"; // Nome correto da aba da planilha

export async function GET(request: Request) {
  try {
    // Formatar a chave privada corretamente
    let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
    // Remover as aspas do início e do fim se existirem
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Substituir \n por quebras de linha reais
    privateKey = privateKey.replace(/\\n/g, "\n");
    
    console.log(
      "Chave privada formatada (primeiros 20 caracteres):",
      privateKey.substring(0, 20) + "..."
    );
    
    // Usar uma abordagem alternativa para autenticação que funciona com Node.js mais recentes
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    
    // Obter cliente autenticado
    const authClient = await auth.getClient();
    
    // Criar cliente do Google Sheets
    const sheets = google.sheets({
      version: "v4",
      auth: authClient
    });

    // Teste simples para verificar a autenticação
    console.log("Tentando acessar a planilha...");
    const testResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:A5`, // Apenas algumas células para teste
    });

    // Escrever um valor de teste na célula A1000
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1000`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["Teste de autenticação: " + new Date().toISOString()]],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teste de autenticação bem-sucedido",
      data: {
        title: testResponse.data.values,
        updatedCells: updateResponse.data.updatedCells,
      },
    });
  } catch (error: any) {
    console.error("Erro no teste de autenticação:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro no teste de autenticação",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
