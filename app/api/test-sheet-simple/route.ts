import { NextResponse } from "next/server";

// ID da planilha de encarte
const SPREADSHEET_ID = "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";

export async function GET(request: Request) {
  try {
    // Verificar se a planilha está acessível publicamente
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
    
    return NextResponse.json({
      success: true,
      message: "Para testar a permissão de escrita na planilha, acesse o link abaixo e tente editar manualmente:",
      sheetUrl: url,
      instructions: "1. Abra o link da planilha\n2. Clique na célula A62\n3. Digite 'olá mundo'\n4. Pressione Enter para confirmar"
    });
  } catch (error: any) {
    console.error("Erro:", error.message);
    return NextResponse.json(
      { success: false, message: "Erro", error: error.message },
      { status: 500 }
    );
  }
}
