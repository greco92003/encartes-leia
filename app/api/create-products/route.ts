import { NextResponse } from "next/server";
import { google } from "googleapis";
import * as path from "path";

// ID da planilha de encarte
const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";
// IMPORTANTE: Esta API adiciona produtos APENAS à aba "produtos" (listagem de produtos)
// e NÃO deve modificar a finaldesemana (encarte atual) em nenhuma circunstância
const SHEET_NAME = "produtos"; // Nome da aba para produtos

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

      // Verificar se a aba "produtos" existe
      console.log(`Verificando se a aba ${SHEET_NAME} existe...`);
      let productSheetId: number | undefined;

      try {
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });

        const sheetsData = spreadsheet.data.sheets || [];
        const productSheet = sheetsData.find(
          (sheet) => sheet.properties?.title === SHEET_NAME
        );

        if (productSheet && productSheet.properties) {
          productSheetId = productSheet.properties.sheetId;
          console.log(`Aba ${SHEET_NAME} encontrada com ID: ${productSheetId}`);
        } else {
          console.log(`Aba ${SHEET_NAME} não encontrada. Criando...`);

          // Criar a aba "produtos"
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
            productSheetId =
              addSheetResponse.data.replies[0].addSheet.properties?.sheetId;
            console.log(`Aba ${SHEET_NAME} criada com ID: ${productSheetId}`);
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

      // Verificar se a planilha tem cabeçalhos na primeira linha
      console.log("Verificando cabeçalhos da planilha...");
      try {
        const existingData = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1:B1`,
        });

        const firstRow = existingData.data.values?.[0] || [];

        // Se a primeira linha estiver vazia ou não tiver os cabeçalhos corretos, adicionar
        if (firstRow.length === 0 || firstRow[0] !== "nome") {
          console.log("Adicionando cabeçalhos à planilha...");
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A1:B1`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [["nome", "imagem"]],
            },
          });
          console.log("Cabeçalhos adicionados com sucesso");
        } else {
          console.log("Cabeçalhos já existem na planilha");
        }
      } catch (error) {
        console.error("Erro ao verificar/adicionar cabeçalhos:", error);
      }

      // Preparar os dados para inserção
      const values = filteredProducts.map((product) => [
        product.nome || "",
        product.imagem || "",
      ]);

      console.log(`Preparando para inserir ${values.length} produtos`);

      // Inserir os dados na planilha usando append (adiciona automaticamente após a última linha)
      try {
        const appendResponse = await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A:B`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: values,
          },
        });

        const updatedCells = appendResponse.data.updates?.updatedCells || 0;
        const updatedRange = appendResponse.data.updates?.updatedRange || "";

        console.log(
          `Produtos inseridos com sucesso: ${updatedCells} células atualizadas em ${updatedRange}`
        );

        return NextResponse.json({
          success: true,
          message: `${filteredProducts.length} produto(s) adicionado(s) com sucesso`,
          updatedCells: updatedCells,
          updatedRange: updatedRange,
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
