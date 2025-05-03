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

interface PendingProduct {
  productName: string;
  imageUrl: string;
  timestamp: number;
}

export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { pendingProducts } = body;

    if (!pendingProducts || !Array.isArray(pendingProducts) || pendingProducts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhum produto pendente para sincronizar",
        },
        { status: 400 }
      );
    }

    console.log(`Recebido ${pendingProducts.length} produtos pendentes para sincronização`);

    // Autenticar com o Google Sheets
    let auth;
    try {
      // Verificar se estamos em ambiente de produção ou desenvolvimento
      const isProduction = process.env.NODE_ENV === "production";
      let credentialsPath;

      if (isProduction) {
        // Em produção, usar as credenciais do ambiente
        const credentials = process.env.GOOGLE_CREDENTIALS;
        if (!credentials) {
          throw new Error("Credenciais do Google não encontradas no ambiente");
        }

        // Criar um arquivo temporário com as credenciais
        const tmpDir = "/tmp";
        credentialsPath = path.join(tmpDir, "credentials.json");
        fs.writeFileSync(credentialsPath, credentials);
      } else {
        // Em desenvolvimento, usar o arquivo de credenciais local
        credentialsPath = path.join(process.cwd(), "app/api/credentials.json");
      }

      // Verificar se o arquivo de credenciais existe
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Arquivo de credenciais não encontrado: ${credentialsPath}`);
      }

      // Ler o arquivo de credenciais
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

      // Criar o cliente de autenticação
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      console.log("Autenticação com o Google Sheets concluída com sucesso");
    } catch (authError) {
      console.error("Erro na autenticação com o Google Sheets:", authError);
      return NextResponse.json(
        {
          success: false,
          message: "Erro na autenticação com o Google Sheets",
          error: String(authError),
        },
        { status: 500 }
      );
    }

    // Criar o cliente do Google Sheets
    const sheets = google.sheets({ version: "v4", auth });

    // Verificar se a aba existe
    let sheetExists = true;
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });

      // Verificar se a aba "produtos" existe
      sheetExists = spreadsheet.data.sheets?.some(
        (sheet) => sheet.properties?.title === SHEET_NAME
      ) || false;

      // Se a aba não existir, vamos criá-la e aguardar um momento para garantir que esteja disponível
      if (!sheetExists) {
        console.log(`A aba ${SHEET_NAME} não existe. Criando...`);
        try {
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

          // Aguardar um momento para garantir que a aba esteja disponível
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Verificar novamente se a aba foi criada
          const updatedResponse = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
          });
          sheetExists = updatedResponse.data.sheets?.some(
            (sheet) => sheet.properties?.title === SHEET_NAME
          ) || false;

          if (!sheetExists) {
            throw new Error(`Não foi possível criar a aba ${SHEET_NAME}`);
          }
        } catch (createSheetError) {
          console.error("Erro ao criar a aba:", createSheetError);
          return NextResponse.json(
            {
              success: false,
              message: `Erro ao criar a aba ${SHEET_NAME}`,
              error: String(createSheetError),
            },
            { status: 500 }
          );
        }
      }
    } catch (sheetError) {
      console.error("Erro ao verificar a aba:", sheetError);
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao verificar a aba da planilha",
          error: String(sheetError),
        },
        { status: 500 }
      );
    }

    // Obter a próxima linha vazia na planilha
    let nextRow = 2; // Começar da linha 2 (após o cabeçalho)
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:B`,
      });

      const values = response.data.values || [];
      nextRow = values.length + 1;

      console.log(`Próxima linha vazia: ${nextRow}`);
    } catch (error) {
      console.error("Erro ao obter dados existentes:", error);
      // Se não conseguir obter os dados, começar da linha 2
      nextRow = 2;
    }

    // Verificar se os produtos já existem na planilha para evitar duplicatas
    let existingProducts: string[] = [];
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:A`,
      });

      existingProducts = (response.data.values || [])
        .flat()
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.toLowerCase().trim());

      console.log(`Produtos existentes: ${existingProducts.length}`);
    } catch (error) {
      console.error("Erro ao verificar produtos existentes:", error);
      // Se não conseguir verificar, continuar com lista vazia
      existingProducts = [];
    }

    // Filtrar produtos que já existem na planilha
    const newProducts = pendingProducts.filter(
      (product: PendingProduct) =>
        !existingProducts.includes(product.productName.toLowerCase().trim())
    );

    if (newProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Todos os produtos já existem na planilha",
        addedCount: 0,
        skippedCount: pendingProducts.length,
      });
    }

    console.log(`Produtos novos para adicionar: ${newProducts.length}`);

    // Preparar os dados para inserção
    const values = newProducts.map((product: PendingProduct) => [
      product.productName,
      product.imageUrl,
    ]);

    // Definir constantes para tentativas
    const maxInsertRetries = 3;
    let insertRetryCount = 0;
    let successCount = 0;
    let failedProducts: PendingProduct[] = [];

    // Processar os produtos em lotes para evitar limitações da API
    const BATCH_SIZE = 10;
    const results = [];

    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);
      console.log(
        `Processando lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} produtos`
      );

      try {
        const appendResponse = await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A${nextRow}`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: batch,
          },
        });

        const updatedRange = appendResponse.data.updates?.updatedRange || "";
        console.log(
          `Lote ${Math.floor(i / BATCH_SIZE) + 1} inserido com sucesso: ${updatedRange}`
        );

        successCount += batch.length;
        nextRow += batch.length;

        results.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          updatedRange,
          count: batch.length,
        });

        // Pequena pausa entre as requisições para evitar limitações de taxa
        if (i + BATCH_SIZE < values.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (batchError) {
        console.error(
          `Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}:`,
          batchError
        );

        // Adicionar produtos deste lote à lista de falhas
        for (let j = 0; j < batch.length; j++) {
          failedProducts.push(newProducts[i + j]);
        }

        results.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: String(batchError),
          count: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${successCount} produtos adicionados, ${failedProducts.length} falhas`,
      addedCount: successCount,
      failedCount: failedProducts.length,
      skippedCount: pendingProducts.length - newProducts.length,
      batchResults: results,
      failedProducts: failedProducts,
    });
  } catch (error) {
    console.error("Erro ao sincronizar produtos pendentes:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao sincronizar produtos pendentes",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
