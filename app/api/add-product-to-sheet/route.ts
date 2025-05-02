import { NextResponse } from "next/server";
import { google } from "googleapis";
import { GOOGLE_SHEETS } from "@/lib/config";

// ID da planilha de produtos
const SPREADSHEET_ID = GOOGLE_SHEETS.PRODUCT_SHEET_ID || "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_NAME = "Página2"; // Nome da aba para produtos

export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { productName, imageUrl } = body;

    if (!productName || !imageUrl) {
      return NextResponse.json(
        { success: false, message: "Nome do produto e URL da imagem são obrigatórios" },
        { status: 400 }
      );
    }

    console.log("Adicionando produto à planilha:", { productName, imageUrl });

    // Carregar as credenciais da conta de serviço
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Inicializar a API do Google Sheets
    const sheets = google.sheets({ version: "v4", auth });

    // Verificar se a planilha existe
    try {
      console.log("Verificando acesso à planilha...");
      const response = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      console.log(
        "Acesso à planilha bem-sucedido:",
        response.data.properties?.title
      );
    } catch (error) {
      console.error("Erro ao acessar a planilha:", error);
      return NextResponse.json(
        { success: false, message: "Erro ao acessar a planilha" },
        { status: 500 }
      );
    }

    // Obter os dados existentes para encontrar a próxima linha vazia
    console.log("Obtendo dados existentes...");
    let nextRow = 2; // Começar da linha 2 por padrão

    try {
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:B`,
      });

      const rows = existingData.data.values || [];
      console.log(`Dados existentes: ${rows.length} linhas`);

      // Verificar se o produto já existe na planilha
      const productExists = rows.some(row => 
        row[0] && row[0].trim().toLowerCase() === productName.trim().toLowerCase()
      );

      if (productExists) {
        console.log("Produto já existe na planilha:", productName);
        return NextResponse.json({
          success: false,
          message: "Este produto já existe na planilha",
          productName,
          imageUrl
        });
      }

      // Encontrar a primeira linha vazia
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0] || row[0].trim() === "") {
          nextRow = i + 1;
          break;
        }
        // Se chegamos ao final e todas as linhas têm dados
        if (i === rows.length - 1) {
          nextRow = rows.length + 1;
        }
      }

      // Garantir que começamos pelo menos da linha 2
      if (nextRow < 2) {
        nextRow = 2;
      }

      console.log(`Próxima linha vazia: ${nextRow}`);
    } catch (error) {
      console.error("Erro ao obter dados existentes:", error);
      // Se não conseguir obter os dados, começar da linha 2
      nextRow = 2;
    }

    // Preparar os dados para inserção
    const values = [[productName, imageUrl]];

    console.log(
      `Inserindo produto na linha ${nextRow}: ${productName}, ${imageUrl}`
    );

    // Inserir os dados na planilha
    try {
      const updateResponse = await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${nextRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: values,
        },
      });

      const updatedCells = updateResponse.data.updatedCells || 0;

      console.log(
        `Produto inserido com sucesso: ${updatedCells} células atualizadas`
      );

      return NextResponse.json({
        success: true,
        message: "Produto adicionado com sucesso",
        productName,
        imageUrl,
        row: nextRow,
        updatedCells
      });
    } catch (updateError) {
      console.error("Erro ao inserir produto:", updateError);
      return NextResponse.json(
        { success: false, message: "Erro ao inserir produto na planilha" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao processar a requisição:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
