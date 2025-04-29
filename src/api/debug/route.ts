import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/google-sheets";

export async function GET() {
  try {
    // Verificar as variáveis de ambiente
    const env = {
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'Não definido',
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'Definido (não mostrado por segurança)' : 'Não definido',
      SPREADSHEET_ID: process.env.SPREADSHEET_ID || 'Não definido',
    };

    // Tentar autenticar com o Google Sheets
    let authResult = 'Falha na autenticação';
    let spreadsheetInfo = null;
    
    try {
      const sheets = await getGoogleSheetsClient();
      authResult = 'Autenticação bem-sucedida';
      
      // Tentar obter informações sobre a planilha
      const spreadsheetId = process.env.SPREADSHEET_ID || '1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8';
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      
      spreadsheetInfo = {
        title: response.data.properties?.title,
        sheets: response.data.sheets?.map(sheet => sheet.properties?.title),
        spreadsheetUrl: response.data.spreadsheetUrl,
      };
    } catch (error) {
      authResult = `Erro na autenticação: ${error.message}`;
    }

    return NextResponse.json({
      env,
      authResult,
      spreadsheetInfo,
      message: 'Esta rota é apenas para depuração',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
