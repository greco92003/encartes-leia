import { NextResponse } from "next/server";
import { GOOGLE_SHEETS } from "@/lib/config";

export async function GET(request: Request) {
  try {
    // Verificar as variáveis de ambiente relacionadas às planilhas
    const env = {
      // Variáveis de ambiente diretas
      SPREADSHEET_ID: process.env.SPREADSHEET_ID || "Não definido",
      SPREADSHEET_PRODUTOS_ID: process.env.SPREADSHEET_PRODUTOS_ID || "Não definido",
      
      // Valores do objeto GOOGLE_SHEETS
      GOOGLE_SHEETS_PRODUCT_SHEET_ID: GOOGLE_SHEETS.PRODUCT_SHEET_ID,
      GOOGLE_SHEETS_OUTPUT_SHEET_ID: GOOGLE_SHEETS.OUTPUT_SHEET_ID,
      
      // Outras variáveis importantes
      GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "Definido" : "Não definido",
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? "Definido (não mostrado por segurança)" : "Não definido",
      
      // Informações do ambiente
      NODE_ENV: process.env.NODE_ENV || "Não definido",
      VERCEL_ENV: process.env.VERCEL_ENV || "Não definido",
      VERCEL_URL: process.env.VERCEL_URL || "Não definido",
    };
    
    return NextResponse.json({
      success: true,
      message: "Informações das variáveis de ambiente",
      env,
    });
  } catch (error: any) {
    console.error("Erro:", error.message);
    return NextResponse.json(
      { success: false, message: "Erro", error: error.message },
      { status: 500 }
    );
  }
}
