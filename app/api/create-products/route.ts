import { NextResponse } from "next/server";
import { google } from "googleapis";
import * as path from "path";

// ID da planilha de encarte
const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";
const SHEET_NAME = "Página2"; // Nome da aba para produtos

export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, message: "Dados de produtos inválidos" },
        { status: 400 }
      );
    }

    // Filtrar apenas os produtos com nome
    const filteredProducts = products.filter((product) => product.nome);

    if (filteredProducts.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhum produto válido fornecido" },
        { status: 400 }
      );
    }

    console.log("Produtos filtrados:", filteredProducts.length);

    try {
      // Usar o arquivo de credenciais para autenticação
      const keyFilePath = path.join(process.cwd(), "app/api/credentials.json");

      const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      // Obter cliente autenticado
      const client = await auth.getClient();

      // Criar cliente do Google Sheets
      const sheets = google.sheets({ version: "v4", auth: client });

      // Verificar se a planilha existe
      console.log("Verificando acesso à planilha...");
      try {
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

      // Verificar se a aba Página2 existe
      console.log("Verificando se a aba Página2 existe...");
      let page2SheetId: number | undefined;

      try {
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });

        const sheetsData = spreadsheet.data.sheets || [];
        const page2Sheet = sheetsData.find(
          (sheet) => sheet.properties?.title === SHEET_NAME
        );

        if (page2Sheet && page2Sheet.properties) {
          page2SheetId = page2Sheet.properties.sheetId;
          console.log(`Aba ${SHEET_NAME} encontrada com ID: ${page2SheetId}`);
        } else {
          console.log(`Aba ${SHEET_NAME} não encontrada. Criando...`);

          // Criar a aba Página2
          const addSheetResponse = await sheets.spreadsheets.batchUpdate({
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

          // Obter o ID da nova aba
          if (
            addSheetResponse.data.replies &&
            addSheetResponse.data.replies[0].addSheet
          ) {
            page2SheetId =
              addSheetResponse.data.replies[0].addSheet.properties?.sheetId;
            console.log(`Aba ${SHEET_NAME} criada com ID: ${page2SheetId}`);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar/criar a aba:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Erro ao verificar/criar a aba da planilha",
          },
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
      const values = filteredProducts.map((product) => [
        product.nome || "",
        product.imagem || "",
      ]);

      console.log(
        `Inserindo ${values.length} produtos a partir da linha ${nextRow}`
      );

      // Processar os produtos em lotes de 10 para evitar limitações da API
      const BATCH_SIZE = 10;
      const results = [];
      let totalUpdatedCells = 0;
      let currentRow = nextRow;

      // Inserir os dados na planilha em lotes
      try {
        for (let i = 0; i < values.length; i += BATCH_SIZE) {
          const batch = values.slice(i, i + BATCH_SIZE);
          console.log(
            `Processando lote ${i / BATCH_SIZE + 1}: ${batch.length} produtos`
          );

          const updateResponse = await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A${currentRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: batch,
            },
          });

          const updatedCells = updateResponse.data.updatedCells || 0;
          totalUpdatedCells += updatedCells;
          currentRow += batch.length;

          console.log(
            `Lote ${
              i / BATCH_SIZE + 1
            } inserido: ${updatedCells} células atualizadas`
          );
          results.push({
            batch: i / BATCH_SIZE + 1,
            updatedCells: updatedCells,
          });

          // Pequena pausa entre as requisições para evitar limitações de taxa
          if (i + BATCH_SIZE < values.length) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        console.log(
          `Todos os produtos inseridos com sucesso: ${totalUpdatedCells} células atualizadas`
        );

        return NextResponse.json({
          success: true,
          message: `${filteredProducts.length} produto(s) adicionado(s) com sucesso`,
          updatedCells: totalUpdatedCells,
          startRow: nextRow,
          batchResults: results,
        });
      } catch (updateError) {
        console.error("Erro ao inserir produtos:", updateError);
        return NextResponse.json(
          { success: false, message: "Erro ao inserir produtos na planilha" },
          { status: 500 }
        );
      }
    } catch (authError) {
      console.error("Erro na autenticação com o Google Sheets:", authError);
      return NextResponse.json(
        { success: false, message: "Erro na autenticação com o Google Sheets" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Erro ao processar a requisição:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
