import { NextResponse } from "next/server";
import { google } from "googleapis";

// Interface for offer data
export interface OfferItem {
  nome: string;
  imagem: string;
  preco: number;
  centavos: number;
  promo: string;
  rodape: string;
  de: string;
  ate: string;
  unidade: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tabParam = (searchParams.get("tab") || "").toLowerCase();
    const sheetName =
      tabParam === "hortifruti"
        ? "hortifruti"
        : tabParam === "carnes"
        ? "especialcarnes"
        : "finaldesemana";

    console.log(
      "API: Iniciando busca de ofertas da planilha | aba:",
      sheetName
    );

    // Autenticar usando o mesmo método do submit-v3 (arquivo de credenciais)
    const keyFilePath = `${process.cwd()}/app/api/credentials.json`;
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Ler valores a partir da linha 2 (cabeçalho na linha 1)
    const spreadsheetId = "1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8";
    const readRange = `${sheetName}!A2:I1000`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: readRange,
    });

    const rows = res.data.values || [];
    console.log(`Linhas obtidas: ${rows.length} da aba ${sheetName}`);

    // Processar os dados da planilha
    let offers: OfferItem[] = [];

    // Verificar se há dados na planilha
    if (rows.length === 0) {
      console.log("Nenhum dado encontrado na planilha");
      return NextResponse.json({
        success: true,
        offers: [],
        count: 0,
        message: "SEM PRODUTOS PARA EXIBIR",
      });
    }

    // Processar os dados reais da planilha
    console.log("Processando dados da planilha");

    offers = rows
      .filter((cols) => (cols || []).some((c) => String(c || "").trim() !== ""))
      .map((cols) => {
        try {
          const cleanColumns = cols.map((c: string) => String(c || "").trim());

          // Processar os dados com validação
          const nome = cleanColumns[0] || "";
          const imagem = cleanColumns[1] || "";

          // Converter preço para número, com fallback para 0
          let preco = 0;
          try {
            preco = cleanColumns[2] ? parseFloat(cleanColumns[2]) : 0;
            if (isNaN(preco)) preco = 0;
          } catch (e) {
            console.error(`Erro ao converter preço: ${cleanColumns[2]}`);
          }

          // Converter centavos para número inteiro, com fallback para 0
          let centavos = 0;
          try {
            centavos = cleanColumns[3] ? parseInt(cleanColumns[3]) : 0;
            if (isNaN(centavos)) centavos = 0;
            centavos = Math.max(0, Math.min(99, centavos));
          } catch (e) {
            console.error(`Erro ao converter centavos: ${cleanColumns[3]}`);
          }

          const promo = cleanColumns[4] || "";
          const rodape = cleanColumns[5] || "";
          const de = cleanColumns[6] || "";
          const ate = cleanColumns[7] || "";

          const unidade = cleanColumns[8]
            ? cleanColumns[8].toLowerCase() === "kg"
              ? "kg"
              : "un"
            : "un";

          return {
            nome,
            imagem,
            preco,
            centavos,
            promo,
            rodape,
            de,
            ate,
            unidade,
          };
        } catch (err) {
          console.error("Erro ao processar linha:", cols, err);
          return null;
        }
      })
      .filter(Boolean) as OfferItem[]; // Remover itens nulos

    // Se não houver ofertas após o processamento, retornar mensagem
    if (offers.length === 0) {
      console.log("Nenhuma oferta encontrada após processamento");

      return NextResponse.json({
        success: true,
        offers: [],
        count: 0,
        message: "SEM PRODUTOS PARA EXIBIR",
      });
    }

    // Filtrar ofertas válidas para a data atual (fuso horário do Brasil)
    const today = new Date();
    // Converter para o fuso horário do Brasil (UTC-3)
    const brazilOffset = -3 * 60; // -3 horas em minutos
    const utcTime = today.getTime() + today.getTimezoneOffset() * 60000;
    const brazilTime = new Date(utcTime + brazilOffset * 60000);

    console.log(
      `Data atual para validação (Brasil): ${brazilTime.toISOString()}`
    );

    const validOffers = offers.filter((offer) => {
      // Se não houver datas definidas, considerar a oferta válida
      if (!offer.de || !offer.ate) {
        console.log(
          `Oferta sem datas definidas: ${offer.nome} - considerada válida`
        );
        return true;
      }

      try {
        // Converter as strings de data para objetos Date no fuso horário local
        // Formatos aceitos: YYYY-MM-DD, DD/MM/YYYY
        let deDate: Date;
        let ateDate: Date;

        // Função para criar data no fuso horário local (evita problemas de UTC)
        const createLocalDate = (dateStr: string): Date => {
          if (dateStr.includes("-")) {
            // Formato YYYY-MM-DD
            const [year, month, day] = dateStr.split("-").map(Number);
            return new Date(year, month - 1, day); // Mês em JS é 0-indexed
          } else if (dateStr.includes("/")) {
            // Formato DD/MM/YYYY
            const [day, month, year] = dateStr.split("/").map(Number);
            return new Date(year, month - 1, day); // Mês em JS é 0-indexed
          } else {
            throw new Error(`Formato de data inválido: ${dateStr}`);
          }
        };

        try {
          deDate = createLocalDate(offer.de);
        } catch (e) {
          console.log(`Formato de data inválido para início: ${offer.de}`);
          return true; // Incluir em caso de formato inválido
        }

        try {
          ateDate = createLocalDate(offer.ate);
        } catch (e) {
          console.log(`Formato de data inválido para fim: ${offer.ate}`);
          return true; // Incluir em caso de formato inválido
        }

        // Ajustar as datas para o início e fim do dia no fuso horário local
        deDate.setHours(0, 0, 0, 0); // Início do dia
        ateDate.setHours(23, 59, 59, 999); // Final do dia

        // Usar a data atual no fuso horário do Brasil para comparação
        const isValid = brazilTime >= deDate && brazilTime <= ateDate;

        console.log(
          `Oferta ${
            offer.nome
          }: de ${deDate.toISOString()} até ${ateDate.toISOString()} - ${
            isValid ? "válida" : "inválida"
          } (data atual Brasil: ${brazilTime.toISOString()})`
        );

        return isValid;
      } catch (err) {
        console.error(
          `Erro ao processar datas para oferta ${offer.nome}:`,
          err
        );
        return true; // Incluir em caso de erro na data
      }
    });

    console.log(`API: Ofertas válidas encontradas: ${validOffers.length}`);

    // Se não houver ofertas válidas, retornar mensagem
    if (validOffers.length === 0) {
      console.log("Nenhuma oferta válida encontrada");

      return NextResponse.json({
        success: true,
        offers: [],
        count: 0,
        message: "SEM PRODUTOS PARA EXIBIR",
      });
    }

    // Log das ofertas para depuração
    if (validOffers.length > 0) {
      console.log("Primeira oferta:", JSON.stringify(validOffers[0], null, 2));
    }

    return NextResponse.json({
      success: true,
      offers: validOffers,
      count: validOffers.length,
    });
  } catch (error) {
    console.error("Erro ao buscar ofertas da planilha:", error);

    // Em caso de erro, retornar array vazio
    return NextResponse.json({
      success: true,
      offers: [],
      count: 0,
      message: "SEM PRODUTOS PARA EXIBIR",
    });
  }
}
