import { NextResponse } from "next/server";
import { google } from "googleapis";
import { GOOGLE_SHEETS } from "@/lib/config";
import * as fs from "fs";
import * as path from "path";

// ID da planilha de produtos
const SPREADSHEET_ID =
  GOOGLE_SHEETS.PRODUCT_SHEET_ID ||
  "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_NAME = "produtos"; // Nome da aba para produtos

export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { productName, imageUrl } = body;

    if (!productName || !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Nome do produto e URL da imagem são obrigatórios",
        },
        { status: 400 }
      );
    }

    console.log("Adicionando produto à planilha:", { productName, imageUrl });

    // Inicializar a autenticação usando o arquivo de credenciais ou variáveis de ambiente
    let auth;
    try {
      // Tentar carregar as credenciais do arquivo JSON primeiro
      const credentialsPath = path.join(
        process.cwd(),
        "app",
        "api",
        "credentials.json"
      );

      if (fs.existsSync(credentialsPath)) {
        console.log("Usando credenciais do arquivo JSON");
        const credentials = JSON.parse(
          fs.readFileSync(credentialsPath, "utf8")
        );
        auth = new google.auth.JWT(
          credentials.client_email,
          undefined,
          credentials.private_key,
          ["https://www.googleapis.com/auth/spreadsheets"]
        );
      } else {
        // Fallback para variáveis de ambiente
        console.log("Usando credenciais das variáveis de ambiente");
        auth = new google.auth.JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
      }
    } catch (authError) {
      console.error("Erro ao configurar autenticação:", authError);
      return NextResponse.json(
        { success: false, message: "Erro de autenticação com o Google Sheets" },
        { status: 500 }
      );
    }

    // Inicializar a API do Google Sheets
    const sheets = google.sheets({ version: "v4", auth });

    // Verificar se a planilha existe e se temos acesso
    try {
      console.log("Verificando acesso à planilha...");
      console.log("Spreadsheet ID:", SPREADSHEET_ID);

      const response = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });

      console.log(
        "Acesso à planilha bem-sucedido:",
        response.data.properties?.title
      );

      // Verificar se a aba "produtos" existe
      const sheetsData = response.data.sheets || [];
      const sheetExists = sheetsData.some(
        (sheet) => sheet.properties?.title === SHEET_NAME
      );

      if (!sheetExists) {
        console.log(`A aba ${SHEET_NAME} não existe. Criando...`);
        // Criar a aba "produtos" se não existir
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
        console.log(`Aba ${SHEET_NAME} criada com sucesso.`);
      }
    } catch (error: any) {
      console.error("Erro ao acessar a planilha:", error);

      // Registrar detalhes adicionais do erro para depuração
      if (error.response) {
        console.error("Detalhes da resposta de erro:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: "Erro ao acessar a planilha",
          details: error.message || "Erro desconhecido",
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

      // Verificar se o produto já existe na planilha
      const productExists = rows.some(
        (row) =>
          row[0] &&
          row[0].trim().toLowerCase() === productName.trim().toLowerCase()
      );

      if (productExists) {
        console.log("Produto já existe na planilha:", productName);
        return NextResponse.json({
          success: false,
          message: "Este produto já existe na planilha",
          productName,
          imageUrl,
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
    } catch (error: any) {
      console.error("Erro ao obter dados existentes:", error);

      // Se o erro for porque a aba não existe, vamos criar
      if (error.message && error.message.includes("Unable to parse range")) {
        console.log(
          `A aba ${SHEET_NAME} não existe ou não está acessível. Tentando criar...`
        );
        try {
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
          console.log(`Aba ${SHEET_NAME} criada com sucesso.`);
          nextRow = 2; // Começar da linha 2 na nova aba
        } catch (createSheetError) {
          console.error("Erro ao criar a aba:", createSheetError);
          return NextResponse.json(
            { success: false, message: "Erro ao criar a aba na planilha" },
            { status: 500 }
          );
        }
      } else {
        // Se não conseguir obter os dados por outro motivo, começar da linha 2
        nextRow = 2;
      }
    }

    // Preparar os dados para inserção
    const values = [[productName, imageUrl]];

    console.log(
      `Inserindo produto na linha ${nextRow}: ${productName}, ${imageUrl}`
    );

    // Tentar usar append em vez de update para adicionar dados sem substituir os existentes
    try {
      // Primeiro tentar com append
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${nextRow}`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: values,
        },
      });

      const updatedRange = appendResponse.data.updates?.updatedRange || "";
      console.log(
        `Produto inserido com sucesso usando append: ${updatedRange}`
      );

      return NextResponse.json({
        success: true,
        message: "Produto adicionado com sucesso",
        productName,
        imageUrl,
        updatedRange,
      });
    } catch (appendError) {
      console.error("Erro ao inserir produto usando append:", appendError);

      // Se falhar com append, tentar com update como fallback
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
          `Produto inserido com sucesso usando update: ${updatedCells} células atualizadas`
        );

        return NextResponse.json({
          success: true,
          message: "Produto adicionado com sucesso",
          productName,
          imageUrl,
          row: nextRow,
          updatedCells,
        });
      } catch (updateError: any) {
        console.error("Erro ao inserir produto usando update:", updateError);

        // Registrar detalhes adicionais do erro
        if (updateError.response) {
          console.error("Detalhes da resposta de erro:", {
            status: updateError.response.status,
            statusText: updateError.response.statusText,
            data: updateError.response.data,
          });
        }

        return NextResponse.json(
          {
            success: false,
            message: "Erro ao inserir produto na planilha",
            details: updateError.message || "Erro desconhecido",
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error("Erro ao processar a requisição:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        details: error.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
