import { NextResponse } from "next/server";
import { google } from "googleapis";
import * as path from 'path';

// ID da planilha de encarte
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";
const SHEET_NAME = "Página1"; // Nome correto da aba da planilha

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Filtrar apenas os itens que têm nome preenchido
    const filledItems = data.items.filter((item: any) => item.nome);

    console.log("Filtered items:", filledItems.length);

    // Preparar os dados para enviar para a planilha
    const values = filledItems.map((item: any) => [
      item.nome,
      item.imagem || "",
      item.preco,
      item.centavos,
      item.promo,
      item.rodape,
      item.de,
      item.ate,
      item.unidade || "un", // Adicionar a unidade na coluna I
    ]);

    console.log("Dados formatados para a planilha:", values.length, "linhas");

    try {
      // Verificar se estamos em modo de teste
      const testMode = process.env.TEST_MODE === "true";
      console.log("Modo de teste:", testMode ? "ativado" : "desativado");

      // Se estamos em modo de teste, apenas simular a atualização da planilha
      if (testMode) {
        console.log("MODO DE TESTE: Simulando atualização da planilha");
        
        // Simular um atraso para parecer que está processando
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("MODO DE TESTE: Simulação concluída com sucesso!");
      } else {
        try {
          // Usar o arquivo de credenciais para autenticação
          const keyFilePath = path.join(process.cwd(), 'app/api/credentials.json');
          
          const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });
          
          // Obter cliente autenticado
          const client = await auth.getClient();
          
          // Criar cliente do Google Sheets
          const sheets = google.sheets({ version: 'v4', auth: client });
          
          // Verificar se há pelo menos um item com dados preenchidos
          const hasFilledData = filledItems.some(
            (item) =>
              item.nome ||
              item.preco ||
              item.centavos ||
              item.promo
          );

          if (!hasFilledData) {
            console.log(
              "Formulário em branco detectado. Não atualizando a planilha."
            );
          } else {
            // Limpar a planilha a partir da linha 2 (preservando os cabeçalhos)
            console.log("Limpando dados existentes...");
            const clearResponse = await sheets.spreadsheets.values.clear({
              spreadsheetId: SPREADSHEET_ID,
              range: `${SHEET_NAME}!A2:I1000`, // Limpar a partir da linha 2, incluindo a coluna I (unidade)
            });
            console.log(
              "Dados existentes limpos com sucesso"
            );

            // Escrever os novos dados a partir da linha 2
            if (values.length > 0) {
              console.log("Enviando novos dados para a planilha...");
              console.log("Dados a serem enviados:", values.length, "linhas");

              const response = await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A2`, // Começar da segunda linha
                valueInputOption: "USER_ENTERED",
                requestBody: {
                  values: values,
                },
              });

              console.log(
                `Planilha atualizada com sucesso: ${response.data.updatedCells} células atualizadas`
              );
            } else {
              console.warn("Nenhum dado para enviar para a planilha");
            }
          }
        } catch (authError: any) {
          console.error("Erro na autenticação com o Google Sheets:", authError.message);
          console.error("Stack trace:", authError.stack);
          
          return NextResponse.json(
            {
              success: false,
              message: "Erro na autenticação com o Google Sheets",
              error: authError.message,
              stack: authError.stack,
              sheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
            },
            { status: 500 }
          );
        }
      }
    } catch (sheetError: any) {
      console.error("Erro ao atualizar a planilha:", sheetError.message);
      console.error("Stack trace:", sheetError.stack);
      
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao atualizar a planilha. Por favor, tente novamente.",
          error: sheetError.message,
          stack: sheetError.stack,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
        },
        { status: 500 }
      );
    }

    // Se chegou aqui, é porque a operação foi bem-sucedida
    return NextResponse.json({
      success: true,
      message: "Dados enviados com sucesso para a planilha",
      sheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
      items: filledItems,
    });
  } catch (error: any) {
    console.error("Error processing form submission:", error.message);
    console.error("Stack trace:", error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to process form submission",
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
