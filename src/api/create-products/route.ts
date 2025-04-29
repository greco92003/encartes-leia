import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { JWT } from "google-auth-library";

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação (opcional)
    // const token = req.headers.get("Authorization")?.split(" ")[1];
    // if (!token) {
    //   console.log("Tentativa de acesso sem token de autenticação");
    //   return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    // }

    // Obter os dados do corpo da requisição
    const body = await req.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, message: "Dados de produtos inválidos" },
        { status: 400 }
      );
    }

    // Filtrar apenas os produtos com nome e imagem
    const filteredProducts = products.filter(
      (product) => product.nome && product.imagem
    );

    if (filteredProducts.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhum produto válido fornecido" },
        { status: 400 }
      );
    }

    console.log("Filtered products:", filteredProducts);

    // Configurar a autenticação com o Google Sheets
    const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Formatar a chave privada corretamente
    let key = process.env.GOOGLE_PRIVATE_KEY || "";
    // Remover as aspas do início e do fim se existirem
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.slice(1, -1);
    }
    // Substituir \n por quebras de linha reais
    key = key.replace(/\\n/g, "\n");

    // Usar o ID da planilha do arquivo .env ou o valor fixo como fallback
    const spreadsheetId =
      process.env.SPREADSHEET_ID ||
      "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";

    if (!email || !key || !spreadsheetId) {
      console.error("Credenciais do Google Sheets não configuradas");
      return NextResponse.json(
        { success: false, message: "Erro de configuração do servidor" },
        { status: 500 }
      );
    }

    console.log("Email da conta de serviço:", email);
    console.log("ID da planilha:", spreadsheetId);
    console.log(
      "Chave privada formatada (primeiros 20 caracteres):",
      key.substring(0, 20)
    );

    // Criar cliente JWT
    const client = new JWT({
      email: email,
      key: key,
      scopes: SCOPES,
    });

    // Criar cliente do Google Sheets
    const sheets = google.sheets({ version: "v4", auth: client });

    // Verificar se a planilha existe
    try {
      console.log("Tentando acessar a planilha...");
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      console.log(
        "Acesso à planilha bem-sucedido. Título:",
        response.data.properties?.title
      );
    } catch (error) {
      console.error("Erro ao acessar a planilha:", error);
      return NextResponse.json(
        { success: false, message: "Erro ao acessar a planilha" },
        { status: 500 }
      );
    }

    // Obter os dados existentes na Página2
    console.log("Tentando obter dados da Página2...");
    try {
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Página2!A:B",
      });

      console.log(
        "Dados obtidos com sucesso. Linhas encontradas:",
        existingData.data.values?.length || 0
      );

      const rows = existingData.data.values || [];

      // Determinar a próxima linha vazia
      let nextRow = rows.length + 1;

      // Se a primeira linha contém cabeçalhos, começamos da linha 2
      if (nextRow === 1) {
        nextRow = 2; // Começar da linha 2 (A2, B2) se a planilha estiver vazia
      }

      console.log(`Próxima linha disponível: ${nextRow}`);

      // Verificar se a aba Página2 existe
      console.log("Verificando se a aba Página2 existe...");
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const sheetsData = spreadsheet.data.sheets || [];
      const page2Exists = sheetsData.some(
        (sheet) => sheet.properties?.title === "Página2"
      );

      if (!page2Exists) {
        console.log("A aba Página2 não existe. Criando...");
        // Criar a aba Página2 se não existir
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: "Página2",
                  },
                },
              },
            ],
          },
        });
        console.log("Aba Página2 criada com sucesso.");
        nextRow = 2; // Começar da linha 2 na nova aba
      }
    } catch (error) {
      console.error("Erro ao obter dados da Página2:", error);

      // Verificar se o erro é porque a aba não existe
      if (error.message && error.message.includes("Unable to parse range")) {
        console.log("A aba Página2 não existe. Criando...");
        // Criar a aba Página2
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: "Página2",
                  },
                },
              },
            ],
          },
        });
        console.log("Aba Página2 criada com sucesso.");
        nextRow = 2; // Começar da linha 2 na nova aba
      } else {
        throw error; // Re-throw se for outro tipo de erro
      }
    }

    // Definir nextRow se não estiver definido
    let nextRow = 2; // Valor padrão se não foi definido anteriormente
    console.log(`Próxima linha disponível para inserção: ${nextRow}`);

    // Preparar os dados para inserção
    const values = filteredProducts.map((product) => [
      product.nome,
      product.imagem,
    ]);
    console.log(`Dados a serem inseridos: ${JSON.stringify(values)}`);

    // Inserir os dados na planilha usando APPEND em vez de UPDATE
    // Isso garante que adicionamos dados sem substituir os existentes
    try {
      // Primeiro, verificamos se há dados existentes para determinar a próxima linha vazia
      const existingData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Página2!A:B",
      });

      const rows = existingData.data.values || [];
      let startRow = rows.length + 1;

      // Se a planilha estiver vazia ou só tiver cabeçalho, começamos da linha 2
      if (startRow <= 1) {
        startRow = 2;
      }

      console.log(`Inserindo dados a partir da linha ${startRow}`);

      // Usar append para adicionar dados sem substituir os existentes
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `Página2!A${startRow}`,
        valueInputOption: "USER_ENTERED", // Usar USER_ENTERED em vez de RAW para evitar copiar formatação
        insertDataOption: "INSERT_ROWS", // Inserir novas linhas
        includeValuesInResponse: true,
        requestBody: {
          values,
        },
      });

      // Garantir que não há formatação sendo copiada
      try {
        // Limpar formatação das células adicionadas
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                updateCells: {
                  range: {
                    sheetId: sheetsData.find(
                      (sheet) => sheet.properties?.title === "Página2"
                    )?.properties?.sheetId,
                    startRowIndex: startRow - 1, // Índices baseados em zero
                    endRowIndex: startRow - 1 + values.length,
                    startColumnIndex: 0,
                    endColumnIndex: 2,
                  },
                  fields: "userEnteredFormat",
                },
              },
            ],
          },
        });
        console.log("Formatação limpa com sucesso.");
      } catch (formatError) {
        console.warn(
          "Aviso: Não foi possível limpar a formatação, mas os dados foram inseridos.",
          formatError
        );
      }

      console.log(
        `Atualização bem-sucedida. Células atualizadas: ${
          appendResponse.data.updates?.updatedCells || 0
        }`
      );

      return NextResponse.json({
        success: true,
        message: `${filteredProducts.length} produto(s) adicionado(s) com sucesso`,
        updatedCells: appendResponse.data.updates?.updatedCells || 0,
      });
    } catch (updateError) {
      console.error("Erro ao atualizar a planilha:", updateError);
      return NextResponse.json(
        { success: false, message: "Erro ao atualizar a planilha" },
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
