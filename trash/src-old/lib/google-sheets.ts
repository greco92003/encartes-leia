import { google } from "googleapis";

// ID da planilha de encarte
const SPREADSHEET_ID = "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";
const SHEET_NAME = "Sheet1"; // Nome da aba da planilha

// Função para autenticar com a API do Google Sheets usando Service Account
export async function getGoogleSheetsClient() {
  try {
    // Obter credenciais das variáveis de ambiente
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;

    // Verificar se as credenciais estão definidas
    if (!email || !key) {
      console.warn(
        "Credenciais do Google Sheets não encontradas nas variáveis de ambiente"
      );
      console.warn("Email:", email ? "Definido" : "Não definido");
      console.warn("Chave privada:", key ? "Definida" : "Não definida");
    } else {
      console.log("Usando credenciais do Service Account:", email);
    }

    // Criar cliente JWT para autenticação
    const jwt = new google.auth.JWT({
      email: email,
      key: key?.replace(/\\n/g, "\n"), // Substituir \n por quebras de linha reais
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Criar cliente da API do Google Sheets
    const sheets = google.sheets({ version: "v4", auth: jwt });

    // Testar a conexão para verificar se as credenciais estão funcionando
    await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    console.log("Autenticação com o Google Sheets bem-sucedida!");
    return sheets;
  } catch (error) {
    console.error("Erro ao autenticar com a API do Google Sheets:", error);

    // Fallback para acesso público (apenas leitura)
    console.warn("Usando fallback para acesso público (apenas leitura)");
    const sheets = google.sheets({ version: "v4" });
    return sheets;
  }
}

// Função para ler dados da planilha
export async function readSpreadsheetData() {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });

    return response.data.values || [];
  } catch (error) {
    console.error("Erro ao ler dados da planilha:", error);
    throw error;
  }
}

// Função para escrever dados na planilha (substituindo todo o conteúdo, mas preservando a linha 1)
export async function writeToSpreadsheet(values: any[][]) {
  try {
    const sheets = await getGoogleSheetsClient();

    // Primeiro, vamos ler os cabeçalhos existentes para preservá-los
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:H1`, // Apenas a primeira linha (cabeçalhos)
    });

    // Limpar a planilha a partir da linha 2 (preservando os cabeçalhos)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:H1000`, // Limpar a partir da linha 2
    });

    // Escrever os novos dados a partir da linha 2
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
    return response.data;
  } catch (error) {
    console.error("Erro ao escrever na planilha:", error);
    throw error;
  }
}

// Função para adicionar linhas à planilha (sem limpar os dados existentes)
export async function appendToSpreadsheet(values: any[][]) {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:H`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao adicionar linhas à planilha:", error);
    throw error;
  }
}
