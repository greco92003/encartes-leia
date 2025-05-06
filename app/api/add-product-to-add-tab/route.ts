import { NextResponse } from "next/server";
import { google } from "googleapis";
import { GOOGLE_SHEETS } from "@/lib/config";
import * as fs from "fs";
import * as path from "path";

// ID da planilha de produtos
const SPREADSHEET_ID =
  GOOGLE_SHEETS.PRODUCT_SHEET_ID ||
  "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_NAME = GOOGLE_SHEETS.PRODUCT_ADD_TAB || "add"; // Nome da aba para adicionar produtos com imagens

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

    console.log(`Recebido pedido para adicionar produto à aba ${SHEET_NAME}:`, {
      productName,
      imageUrl: imageUrl.substring(0, 30) + "...",
    });

    // Configurar autenticação com o Google Sheets
    let auth;
    try {
      // Verificar se estamos em ambiente de produção ou desenvolvimento
      if (process.env.NODE_ENV === "production") {
        // Em produção, usar variáveis de ambiente
        console.log("Usando credenciais de variáveis de ambiente");
        
        // Formatar a chave privada corretamente
        let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
        // Remover as aspas do início e do fim se existirem
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
        // Substituir \n por quebras de linha reais
        privateKey = privateKey.replace(/\\n/g, "\n");

        auth = new google.auth.JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: privateKey,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
      } else {
        // Em desenvolvimento, usar arquivo de credenciais
        console.log("Usando arquivo de credenciais");
        const credentialsPath = path.join(
          process.cwd(),
          "app",
          "api",
          "credentials.json"
        );
        
        if (fs.existsSync(credentialsPath)) {
          const credentials = JSON.parse(
            fs.readFileSync(credentialsPath, "utf8")
          );
          
          auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          });
        } else {
          throw new Error(`Arquivo de credenciais não encontrado: ${credentialsPath}`);
        }
      }
    } catch (authError) {
      console.error("Erro ao configurar autenticação:", authError);
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao configurar autenticação com o Google Sheets",
          error: String(authError),
        },
        { status: 500 }
      );
    }

    // Inicializar cliente do Google Sheets
    const sheets = google.sheets({ version: "v4", auth });

    // Verificar se a aba existe
    try {
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

    // Obter a próxima linha vazia na planilha
    let nextRow = 2; // Começar da linha 2 (após o cabeçalho)
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:B`,
      });

      const values = response.data.values || [];
      nextRow = values.length + 1;

      // Se a planilha estiver vazia, adicionar cabeçalho
      if (values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1:B1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [["Nome do Produto", "URL da Imagem"]],
          },
        });
        nextRow = 2; // Começar da linha 2 após adicionar o cabeçalho
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
      `Inserindo produto na linha ${nextRow}: ${productName}, ${imageUrl.substring(0, 30)}...`
    );

    // Inserir os dados na planilha
    try {
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${nextRow}`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        includeValuesInResponse: true,
        requestBody: {
          values: values,
        },
      });

      const updatedRange = appendResponse.data.updates?.updatedRange || "";
      console.log(
        `Produto inserido com sucesso na aba ${SHEET_NAME}: ${updatedRange}`
      );

      return NextResponse.json({
        success: true,
        message: `Produto adicionado com sucesso na aba ${SHEET_NAME}`,
        productName,
        imageUrl,
        updatedRange,
      });
    } catch (appendError) {
      console.error(`Erro ao inserir produto na aba ${SHEET_NAME}:`, appendError);
      
      // Tentar método alternativo com update
      try {
        const updateResponse = await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A${nextRow}:B${nextRow}`,
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
          message: `Produto adicionado com sucesso na aba ${SHEET_NAME}`,
          productName,
          imageUrl,
          row: nextRow,
          updatedCells,
        });
      } catch (updateError) {
        console.error(`Erro ao inserir produto usando update:`, updateError);
        return NextResponse.json(
          {
            success: false,
            message: `Erro ao adicionar produto na aba ${SHEET_NAME}`,
            error: String(updateError),
          },
          { status: 500 }
        );
      }
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
