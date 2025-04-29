import { NextResponse } from "next/server";
import { GOOGLE_SHEETS } from "@/lib/config";

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

export async function GET() {
  try {
    console.log("API: Iniciando busca de ofertas da planilha");

    // Usar a API pública do Google Sheets para obter os dados em formato CSV
    // Formato alternativo que pode ser mais confiável
    // Usar o ID da planilha diretamente para garantir que estamos acessando a planilha correta
    const url = `https://docs.google.com/spreadsheets/d/1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8/export?format=csv&gid=0`;
    console.log("Buscando dados da URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Falha ao buscar dados da planilha. Status: ${response.status}`
      );
    }

    const csvText = await response.text();
    console.log("CSV recebido:", csvText.substring(0, 200) + "..."); // Log dos primeiros 200 caracteres

    // Processar o CSV manualmente
    const rows = csvText.split("\n").slice(1); // Pular a primeira linha (cabeçalho)
    console.log(`Número de linhas encontradas: ${rows.length}`);

    // Mostrar as primeiras linhas para depuração
    if (rows.length > 0) {
      console.log("Primeiras 3 linhas do CSV:");
      rows.slice(0, 3).forEach((row, index) => {
        console.log(`Linha ${index + 1}: ${row}`);
      });
    }

    // Processar os dados da planilha
    let offers: OfferItem[] = [];

    // Verificar se há dados na planilha
    if (rows.length === 0 || (rows.length === 1 && rows[0].trim() === "")) {
      console.log("Nenhum dado encontrado na planilha");

      // Retornar array vazio
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
      .filter((row) => row.trim() !== "") // Filtrar linhas vazias
      .map((row) => {
        try {
          // Método mais robusto para dividir a linha em colunas, respeitando aspas
          let columns: string[] = [];

          // Verificar se a linha contém aspas (o que pode indicar campos com vírgulas)
          if (row.includes('"')) {
            // Usar regex para lidar com campos que contêm vírgulas dentro de aspas
            const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (matches) {
              columns = matches.map((col) => col.replace(/^"|"$/g, "").trim());
            } else {
              // Fallback para o método simples
              columns = row
                .split(",")
                .map((col) => col.trim().replace(/^"|"$/g, ""));
            }
          } else {
            // Método simples para linhas sem aspas
            columns = row.split(",").map((col) => col.trim());
          }

          const cleanColumns = columns;

          console.log(`Processando linha: ${row.substring(0, 50)}...`);
          console.log(`Colunas encontradas: ${cleanColumns.length}`);

          // Mostrar as colunas para depuração
          cleanColumns.forEach((col, idx) => {
            console.log(
              `  Coluna ${idx + 1}: ${col.substring(0, 30)}${
                col.length > 30 ? "..." : ""
              }`
            );
          });

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
            // Garantir que centavos esteja entre 0 e 99
            centavos = Math.max(0, Math.min(99, centavos));
          } catch (e) {
            console.error(`Erro ao converter centavos: ${cleanColumns[3]}`);
          }

          // Processar promoção (show/hide ou texto personalizado)
          const promo = cleanColumns[4] || "";

          // Processar rodapé
          const rodape = cleanColumns[5] || "";

          // Processar datas
          const de = cleanColumns[6] || "";
          const ate = cleanColumns[7] || "";

          // Processar unidade (kg ou un)
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
          console.error(`Erro ao processar linha: ${row}`, err);
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

    // Filtrar ofertas válidas para a data atual
    const today = new Date();
    console.log(`Data atual para validação: ${today.toISOString()}`);

    const validOffers = offers.filter((offer) => {
      // Se não houver datas definidas, considerar a oferta válida
      if (!offer.de || !offer.ate) {
        console.log(
          `Oferta sem datas definidas: ${offer.nome} - considerada válida`
        );
        return true;
      }

      try {
        // Converter as strings de data para objetos Date
        // Formatos aceitos: YYYY-MM-DD, DD/MM/YYYY
        let deDate: Date;
        let ateDate: Date;

        // Verificar formato da data (YYYY-MM-DD ou DD/MM/YYYY)
        if (offer.de.includes("-")) {
          deDate = new Date(offer.de);
        } else if (offer.de.includes("/")) {
          const [day, month, year] = offer.de.split("/").map(Number);
          deDate = new Date(year, month - 1, day); // Mês em JS é 0-indexed
        } else {
          console.log(`Formato de data inválido para início: ${offer.de}`);
          return true; // Incluir em caso de formato inválido
        }

        if (offer.ate.includes("-")) {
          ateDate = new Date(offer.ate);
        } else if (offer.ate.includes("/")) {
          const [day, month, year] = offer.ate.split("/").map(Number);
          ateDate = new Date(year, month - 1, day); // Mês em JS é 0-indexed
        } else {
          console.log(`Formato de data inválido para fim: ${offer.ate}`);
          return true; // Incluir em caso de formato inválido
        }

        // Ajustar a data final para o final do dia (23:59:59)
        ateDate.setHours(23, 59, 59, 999);

        const isValid = today >= deDate && today <= ateDate;
        console.log(
          `Oferta ${
            offer.nome
          }: de ${deDate.toISOString()} até ${ateDate.toISOString()} - ${
            isValid ? "válida" : "inválida"
          }`
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
