import * as XLSX from "xlsx";

export interface Product {
  nome: string;
  imagem?: string;
  id?: string; // ID único para cada produto
}

export interface FormData {
  nome: string;
  imagem?: string;
  preco: number;
  centavos: number;
  promo: boolean;
  rodape?: string;
  rodapeQuantidade?: number;
  rodapeTipo?: "comprando" | "limite";
  de?: Date;
  ate?: Date;
}

export async function readProductsFromExcel(): Promise<Product[]> {
  try {
    const response = await fetch("/produtos.xlsx");
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<Product>(worksheet);

    return jsonData;
  } catch (error) {
    console.error("Error reading Excel file:", error);
    return [];
  }
}

export async function fetchProductsFromGoogleSheet(): Promise<Product[]> {
  try {
    // ID da planilha de produtos e imagens
    const sheetId = "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";

    // Usamos a API pública do Google Sheets para obter os dados em formato CSV
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`
    );

    if (!response.ok) {
      throw new Error("Falha ao buscar dados da planilha");
    }

    const csvText = await response.text();

    // Processamento manual do CSV para extrair nome e imagem
    const lines = csvText.split("\n");
    const products: Product[] = [];

    // Começamos do índice 1 para pular o cabeçalho
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        // Dividimos a linha, considerando que vírgulas dentro de aspas não são separadores
        const match = line.match(/"([^"]*)"|([^,]+)/g);

        if (match && match.length >= 2) {
          // Removemos as aspas
          const nome = match[0].replace(/"/g, "").trim();
          const imagem = match[1].replace(/"/g, "").trim();

          if (nome) {
            products.push({ nome, imagem });
          }
        }
      }
    }

    return products;
  } catch (error) {
    console.error("Erro ao buscar produtos da planilha do Google:", error);
    // Fallback para o arquivo local em caso de erro
    return readProductsFromExcel();
  }
}

// Interface para representar a estrutura da planilha do Google Sheets
export interface SpreadsheetRow {
  nome: string; // Coluna A
  imagem: string; // Coluna B - Agora incluiremos o link da imagem diretamente
  preco: number; // Coluna C
  centavos: number; // Coluna D
  promo: string; // Coluna E
  rodape: string; // Coluna F
  de: string; // Coluna G
  ate: string; // Coluna H
}

export function formatDataForSpreadsheet(
  formData: FormData[],
  products: Product[]
): SpreadsheetRow[] {
  return formData.map((item) => {
    // Encontrar a imagem correspondente ao produto
    const product = products.find((p) => p.nome === item.nome);
    const imagem = product?.imagem || "";

    return {
      nome: item.nome,
      imagem: imagem, // Agora incluímos o link da imagem diretamente
      preco: item.preco,
      centavos: item.centavos,
      promo: item.promo ? "show" : "hide",
      rodape:
        item.promo && item.rodapeTipo
          ? item.rodapeTipo === "comprando"
            ? `Comprando ${item.rodapeQuantidade}un do item`
            : `Limite ${item.rodapeQuantidade}un por cliente`
          : "",
      de: item.de ? item.de : "",
      ate: item.ate ? item.ate : "",
    };
  });
}
