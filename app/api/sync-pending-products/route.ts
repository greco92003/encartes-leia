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
const ADD_SHEET_NAME = GOOGLE_SHEETS.PRODUCT_ADD_TAB || "add"; // Nome da aba para adicionar produtos com imagens

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

    if (
      !pendingProducts ||
      !Array.isArray(pendingProducts) ||
      pendingProducts.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhum produto pendente para sincronizar",
        },
        { status: 400 }
      );
    }

    console.log(
      `Recebido ${pendingProducts.length} produtos pendentes para sincronização`
    );

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
        throw new Error(
          `Arquivo de credenciais não encontrado: ${credentialsPath}`
        );
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

    // Verificar se as abas existem
    let productsSheetExists = true;
    let addSheetExists = true;

    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });

      // Verificar se a aba "produtos" existe
      productsSheetExists =
        spreadsheet.data.sheets?.some(
          (sheet) => sheet.properties?.title === SHEET_NAME
        ) || false;

      // Verificar se a aba "add" existe
      addSheetExists =
        spreadsheet.data.sheets?.some(
          (sheet) => sheet.properties?.title === ADD_SHEET_NAME
        ) || false;

      // Se a aba "produtos" não existir, vamos criá-la
      if (!productsSheetExists) {
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
          productsSheetExists =
            updatedResponse.data.sheets?.some(
              (sheet) => sheet.properties?.title === SHEET_NAME
            ) || false;

          if (!productsSheetExists) {
            throw new Error(`Não foi possível criar a aba ${SHEET_NAME}`);
          }
        } catch (createSheetError) {
          console.error(`Erro ao criar a aba ${SHEET_NAME}:`, createSheetError);
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

      // Se a aba "add" não existir, vamos criá-la
      if (!addSheetExists) {
        console.log(`A aba ${ADD_SHEET_NAME} não existe. Criando...`);
        try {
          // Criar a aba "add" se não existir
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: ADD_SHEET_NAME,
                    },
                  },
                },
              ],
            },
          });
          console.log(`Aba ${ADD_SHEET_NAME} criada com sucesso.`);

          // Aguardar um momento para garantir que a aba esteja disponível
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Verificar novamente se a aba foi criada
          const updatedResponse = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
          });
          addSheetExists =
            updatedResponse.data.sheets?.some(
              (sheet) => sheet.properties?.title === ADD_SHEET_NAME
            ) || false;

          if (!addSheetExists) {
            throw new Error(`Não foi possível criar a aba ${ADD_SHEET_NAME}`);
          }
        } catch (createSheetError) {
          console.error(
            `Erro ao criar a aba ${ADD_SHEET_NAME}:`,
            createSheetError
          );
          return NextResponse.json(
            {
              success: false,
              message: `Erro ao criar a aba ${ADD_SHEET_NAME}`,
              error: String(createSheetError),
            },
            { status: 500 }
          );
        }
      }
    } catch (sheetError) {
      console.error("Erro ao verificar as abas:", sheetError);
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao verificar as abas da planilha",
          error: String(sheetError),
        },
        { status: 500 }
      );
    }

    // Obter a próxima linha vazia nas planilhas
    let nextRowProducts = 2; // Começar da linha 2 (após o cabeçalho) para a aba "produtos"
    let nextRowAdd = 2; // Começar da linha 2 (após o cabeçalho) para a aba "add"

    try {
      // Obter próxima linha vazia na aba "produtos"
      const responseProducts = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:B`,
      });

      const valuesProducts = responseProducts.data.values || [];
      nextRowProducts = valuesProducts.length + 1;

      console.log(
        `Próxima linha vazia na aba "${SHEET_NAME}": ${nextRowProducts}`
      );

      // Obter próxima linha vazia na aba "add"
      const responseAdd = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${ADD_SHEET_NAME}!A:B`,
      });

      const valuesAdd = responseAdd.data.values || [];
      nextRowAdd = valuesAdd.length + 1;

      // Se a aba "add" estiver vazia, adicionar cabeçalho
      if (valuesAdd.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${ADD_SHEET_NAME}!A1:B1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [["Nome do Produto", "URL da Imagem"]],
          },
        });
        console.log(`Cabeçalho adicionado à aba "${ADD_SHEET_NAME}"`);
        nextRowAdd = 2; // Começar da linha 2 após adicionar o cabeçalho
      }

      console.log(
        `Próxima linha vazia na aba "${ADD_SHEET_NAME}": ${nextRowAdd}`
      );
    } catch (error) {
      console.error("Erro ao obter dados existentes:", error);
      // Se não conseguir obter os dados, começar da linha 2
      nextRowProducts = 2;
      nextRowAdd = 2;
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
    const resultsProducts = []; // Resultados para a aba "produtos"
    const resultsAdd = []; // Resultados para a aba "add"

    // Primeiro, adicionar à aba "produtos"
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);
      console.log(
        `Processando lote ${
          Math.floor(i / BATCH_SIZE) + 1
        } para aba "${SHEET_NAME}": ${batch.length} produtos`
      );

      try {
        const appendResponse = await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A${nextRowProducts}`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: batch,
          },
        });

        const updatedRange = appendResponse.data.updates?.updatedRange || "";
        console.log(
          `Lote ${
            Math.floor(i / BATCH_SIZE) + 1
          } inserido com sucesso na aba "${SHEET_NAME}": ${updatedRange}`
        );

        successCount += batch.length;
        nextRowProducts += batch.length;

        resultsProducts.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          updatedRange,
          count: batch.length,
          sheet: SHEET_NAME,
        });

        // Pequena pausa entre as requisições para evitar limitações de taxa
        if (i + BATCH_SIZE < values.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (batchError) {
        console.error(
          `Erro ao inserir lote ${
            Math.floor(i / BATCH_SIZE) + 1
          } na aba "${SHEET_NAME}":`,
          batchError
        );

        // Adicionar produtos deste lote à lista de falhas
        for (let j = 0; j < batch.length; j++) {
          failedProducts.push(newProducts[i + j]);
        }

        resultsProducts.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: String(batchError),
          count: 0,
          sheet: SHEET_NAME,
        });
      }
    }

    // Agora, adicionar à aba "add"
    let addSuccessCount = 0;
    let addFailedProducts: PendingProduct[] = [];

    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      const batch = values.slice(i, i + BATCH_SIZE);
      console.log(
        `Processando lote ${
          Math.floor(i / BATCH_SIZE) + 1
        } para aba "${ADD_SHEET_NAME}": ${batch.length} produtos`
      );

      try {
        const appendResponse = await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${ADD_SHEET_NAME}!A${nextRowAdd}`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: batch,
          },
        });

        const updatedRange = appendResponse.data.updates?.updatedRange || "";
        console.log(
          `Lote ${
            Math.floor(i / BATCH_SIZE) + 1
          } inserido com sucesso na aba "${ADD_SHEET_NAME}": ${updatedRange}`
        );

        addSuccessCount += batch.length;
        nextRowAdd += batch.length;

        resultsAdd.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          updatedRange,
          count: batch.length,
          sheet: ADD_SHEET_NAME,
        });

        // Pequena pausa entre as requisições para evitar limitações de taxa
        if (i + BATCH_SIZE < values.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (batchError) {
        console.error(
          `Erro ao inserir lote ${
            Math.floor(i / BATCH_SIZE) + 1
          } na aba "${ADD_SHEET_NAME}":`,
          batchError
        );

        // Adicionar produtos deste lote à lista de falhas
        for (let j = 0; j < batch.length; j++) {
          addFailedProducts.push(newProducts[i + j]);
        }

        resultsAdd.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: String(batchError),
          count: 0,
          sheet: ADD_SHEET_NAME,
        });
      }
    }

    // Combinar os resultados
    const results = [...resultsProducts, ...resultsAdd];

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${successCount} produtos adicionados à aba "${SHEET_NAME}" e ${addSuccessCount} à aba "${ADD_SHEET_NAME}"`,
      addedCount: {
        products: successCount,
        add: addSuccessCount,
      },
      failedCount: {
        products: failedProducts.length,
        add: addFailedProducts.length,
      },
      skippedCount: pendingProducts.length - newProducts.length,
      batchResults: results,
      failedProducts: {
        products: failedProducts,
        add: addFailedProducts,
      },
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
