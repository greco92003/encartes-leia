import { NextResponse } from "next/server";
import { google } from "googleapis";

// ID da planilha de encarte
const SPREADSHEET_ID = "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";
const SHEET_NAME = "Página1"; // Nome correto da aba da planilha

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Filtrar apenas os itens que têm nome preenchido
    const filledItems = data.items.filter((item: any) => item.nome);

    console.log("Filtered items:", filledItems);

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

    try {
      // Verificar se estamos em modo de teste
      const testMode = process.env.TEST_MODE === "true";
      console.log("Modo de teste:", testMode ? "ativado" : "desativado");

      // Adicionar logs para debug
      console.log(
        "Email da conta de serviço:",
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      );
      console.log("ID da planilha:", SPREADSHEET_ID);

      // Se estamos em modo de teste, apenas simular a atualização da planilha
      if (testMode) {
        console.log("MODO DE TESTE: Simulando atualização da planilha");
        console.log("Dados que seriam enviados:", JSON.stringify(values));

        // Simular um atraso para parecer que está processando
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("MODO DE TESTE: Simulação concluída com sucesso!");
      } else {
        // Formatar a chave privada corretamente
        let privateKey = process.env.GOOGLE_PRIVATE_KEY || "";
        // Remover as aspas do início e do fim se existirem
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
        // Substituir \n por quebras de linha reais
        privateKey = privateKey.replace(/\\n/g, "\n");

        console.log(
          "Chave privada formatada (primeiros 20 caracteres):",
          privateKey.substring(0, 20) + "..."
        );

        // Autenticar com o Google Sheets API
        const auth = new google.auth.JWT({
          email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: privateKey,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });

        // Teste simples para verificar a autenticação
        console.log("Tentando acessar a planilha...");
        const testResponse = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });
        console.log(
          "Acesso à planilha bem-sucedido. Título:",
          testResponse.data.properties?.title
        );

        // Verificar se há pelo menos um item com dados preenchidos
        const hasFilledData = filledItems.some(
          (item) =>
            item.nome ||
            item.preco ||
            item.centavos ||
            item.promo ||
            item.footer ||
            item.fromDate ||
            item.toDate
        );

        if (!hasFilledData) {
          console.log(
            "Formulário em branco detectado. Não atualizando a planilha."
          );
        } else {
          // Limpar a planilha a partir da linha 2 (preservando os cabeçalhos)
          console.log("Limpando dados existentes...");
          await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2:I1000`, // Limpar a partir da linha 2, incluindo a coluna I (unidade)
          });
          console.log("Dados existentes limpos com sucesso.");

          // Escrever os novos dados a partir da linha 2
          if (values.length > 0) {
            console.log("Enviando novos dados para a planilha...");
            console.log("Dados a serem enviados:", JSON.stringify(values));

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
      }
    } catch (sheetError: any) {
      console.error("Erro ao atualizar a planilha:", sheetError.message);
      console.error("Detalhes do erro:", sheetError);
      // Continuar mesmo com erro na planilha, para que o usuário possa ver os dados
    }

    return NextResponse.json({
      success: true,
      message: "Data submitted successfully",
      sheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
      items: filledItems,
      note: "Para editar a planilha manualmente, acesse o link acima e tente adicionar 'olá mundo' na célula A62",
    });
  } catch (error: any) {
    console.error("Error processing form submission:", error.message);
    return NextResponse.json(
      { success: false, message: "Failed to process form submission" },
      { status: 500 }
    );
  }
}
