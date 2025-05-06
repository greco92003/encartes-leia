import { NextResponse } from "next/server";
import { google } from "googleapis";
import { GOOGLE_SHEETS } from "@/lib/config";
import { supabase } from "@/lib/supabase-client";

// ID da planilha de produtos
const SPREADSHEET_ID =
  GOOGLE_SHEETS.PRODUCT_SHEET_ID ||
  "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_NAME = GOOGLE_SHEETS.PRODUCT_ADD_TAB || "add"; // Nome da aba para adicionar produtos com imagens

// Função para testar a adição de um produto real do Supabase à aba "add"
export async function GET(request: Request) {
  try {
    console.log(`Tentando buscar uma imagem do Supabase e adicionar à aba ${SHEET_NAME}...`);
    
    // Buscar uma imagem do bucket do Supabase
    const { data: files, error } = await supabase.storage
      .from("imagens")
      .list("", {
        limit: 1,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Erro ao buscar imagens do Supabase:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao buscar imagens do Supabase",
          error: String(error),
        },
        { status: 500 }
      );
    }

    if (!files || files.length === 0) {
      console.error("Nenhuma imagem encontrada no Supabase");
      return NextResponse.json(
        {
          success: false,
          message: "Nenhuma imagem encontrada no Supabase",
        },
        { status: 404 }
      );
    }

    // Obter a primeira imagem
    const file = files[0];
    console.log("Imagem encontrada no Supabase:", file.name);

    // Gerar URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from("imagens")
      .getPublicUrl(file.name);

    // Extrair nome do produto do nome do arquivo
    const productName = file.name.substring(0, file.name.lastIndexOf("."));
    
    console.log(`Nome do produto: ${productName}`);
    console.log(`URL da imagem: ${publicUrl}`);
    
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
        
        // Adicionar cabeçalho
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1:B1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [["Nome do Produto", "URL da Imagem"]],
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

    // Preparar os dados para inserção
    const values = [[productName, publicUrl]];

    // Inserir os dados na planilha usando append
    try {
      console.log(`Inserindo produto na aba ${SHEET_NAME}...`);
      
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
      console.log(`Produto inserido com sucesso na aba ${SHEET_NAME}: ${updatedRange}`);

      return NextResponse.json({
        success: true,
        message: `Produto real adicionado com sucesso à aba ${SHEET_NAME}`,
        productName,
        imageUrl: publicUrl,
        updatedRange,
      });
    } catch (error) {
      console.error(`Erro ao inserir produto na aba ${SHEET_NAME}:`, error);
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao adicionar produto real à aba ${SHEET_NAME}`,
          error: String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
