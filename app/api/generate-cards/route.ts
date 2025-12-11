import { NextRequest, NextResponse } from "next/server";

interface Product {
  nome: string;
  imagem?: string;
  unidade: "un" | "kg";
  preco: string | number;
  centavos: string | number;
  promo: boolean;
  rodapeTipo?: "comprando" | "limite";
  rodapeQuantidade?: number;
}

interface GridConfig {
  productsPerRow: 1 | 2 | 3 | 4;
  numberOfRows: 1 | 2 | 3;
  totalProducts: number;
  cardSize: "1080x1080" | "1080x1920";
  cardWidth: number;
  cardHeight: number;
  imageSize: number;
}

interface DesignConfig {
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  priceColor: string;
  titleFontSize: number;
  priceFontSize: number;
  descriptionFontSize: number;
  fontFamily: "Arial" | "Helvetica" | "Georgia" | "Times" | "Courier";
  textAlignment: "left" | "center" | "right";
  logoPosition: "top-left" | "top-center" | "top-right";
  padding: number;
  borderRadius: number;
  shadow: boolean;
  border: boolean;
  borderColor: string;
}

interface CardGenerationRequest {
  products: Product[];
  gridConfig: GridConfig;
  designConfig: DesignConfig;
  atacadoLogo?: string;
  ofertaLogo?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CardGenerationRequest = await request.json();
    
    const {
      products,
      gridConfig,
      designConfig,
      atacadoLogo,
      ofertaLogo,
      dateRange
    } = body;

    // Validações básicas
    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto fornecido" },
        { status: 400 }
      );
    }

    if (!gridConfig || !designConfig) {
      return NextResponse.json(
        { error: "Configurações de grid e design são obrigatórias" },
        { status: 400 }
      );
    }

    // Calcular quantos cards serão necessários
    const productsPerCard = gridConfig.productsPerRow * gridConfig.numberOfRows;
    const totalCards = Math.ceil(products.length / productsPerCard);

    console.log(`Gerando ${totalCards} card(s) para ${products.length} produtos`);

    // Gerar dados para cada card
    const cards = [];
    for (let cardIndex = 0; cardIndex < totalCards; cardIndex++) {
      const startIndex = cardIndex * productsPerCard;
      const endIndex = Math.min(startIndex + productsPerCard, products.length);
      const cardProducts = products.slice(startIndex, endIndex);

      // Gerar HTML/CSS para o card
      const cardHtml = generateCardHTML({
        products: cardProducts,
        gridConfig,
        designConfig,
        atacadoLogo,
        ofertaLogo,
        dateRange,
        cardIndex: cardIndex + 1,
        totalCards
      });

      cards.push({
        index: cardIndex + 1,
        products: cardProducts.length,
        html: cardHtml
      });
    }

    return NextResponse.json({
      success: true,
      message: `${totalCards} card(s) gerado(s) com sucesso`,
      data: {
        totalCards,
        totalProducts: products.length,
        productsPerCard,
        cards
      }
    });

  } catch (error) {
    console.error("Erro ao gerar cards:", error);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor ao gerar cards",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}

function generateCardHTML(params: {
  products: Product[];
  gridConfig: GridConfig;
  designConfig: DesignConfig;
  atacadoLogo?: string;
  ofertaLogo?: string;
  dateRange?: { from?: string; to?: string };
  cardIndex: number;
  totalCards: number;
}): string {
  
  const {
    products,
    gridConfig,
    designConfig,
    atacadoLogo,
    ofertaLogo,
    dateRange,
    cardIndex,
    totalCards
  } = params;

  const formatPrice = (preco: string | number, centavos: string | number) => {
    const precoNum = typeof preco === "string" ? parseFloat(preco) || 0 : preco;
    const centavosNum = typeof centavos === "string" ? parseFloat(centavos) || 0 : centavos;
    return `R$ ${precoNum},${centavosNum.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getValidityText = () => {
    if (dateRange?.from && dateRange?.to) {
      return `Válido de ${formatDate(dateRange.from)} até ${formatDate(dateRange.to)}`;
    }
    return "Consulte validade na loja";
  };

  // Calcular distribuição dos produtos
  const { productsPerRow, numberOfRows } = gridConfig;
  const fullRows = Math.floor(products.length / productsPerRow);
  const remainingProducts = products.length % productsPerRow;

  // Gerar grid de produtos
  let productGridHTML = "";
  let productIndex = 0;

  // Linhas completas
  for (let row = 0; row < fullRows && row < numberOfRows; row++) {
    productGridHTML += `<div class="product-row">`;
    for (let col = 0; col < productsPerRow; col++) {
      if (productIndex < products.length) {
        const product = products[productIndex];
        productGridHTML += generateProductHTML(product, gridConfig, designConfig);
        productIndex++;
      }
    }
    productGridHTML += `</div>`;
  }

  // Linha com produtos restantes (centralizada)
  if (remainingProducts > 0 && fullRows < numberOfRows) {
    const emptySpaces = Math.floor((productsPerRow - remainingProducts) / 2);
    productGridHTML += `<div class="product-row centered">`;
    
    // Espaços vazios para centralizar
    for (let i = 0; i < emptySpaces; i++) {
      productGridHTML += `<div class="empty-space"></div>`;
    }
    
    // Produtos restantes
    for (let i = 0; i < remainingProducts; i++) {
      if (productIndex < products.length) {
        const product = products[productIndex];
        productGridHTML += generateProductHTML(product, gridConfig, designConfig);
        productIndex++;
      }
    }
    
    productGridHTML += `</div>`;
  }

  // HTML completo do card
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card ${cardIndex} de ${totalCards}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        .card {
            width: ${gridConfig.cardWidth}px;
            height: ${gridConfig.cardHeight}px;
            background-color: ${designConfig.backgroundColor};
            padding: ${designConfig.padding}px;
            font-family: ${designConfig.fontFamily}, sans-serif;
            position: relative;
            ${designConfig.border ? `border: 1px solid ${designConfig.borderColor};` : ''}
            border-radius: ${designConfig.borderRadius}px;
            ${designConfig.shadow ? 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);' : ''}
            display: flex;
            flex-direction: column;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            min-height: 60px;
        }
        
        .logo-atacado {
            max-height: 50px;
            max-width: 200px;
            object-fit: contain;
        }
        
        .logo-oferta {
            max-height: 40px;
            max-width: 150px;
            object-fit: contain;
        }
        
        .products-grid {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .product-row {
            display: grid;
            grid-template-columns: repeat(${productsPerRow}, 1fr);
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .product-row.centered {
            justify-items: center;
        }
        
        .product {
            display: flex;
            flex-direction: column;
            align-items: ${designConfig.textAlignment};
            text-align: ${designConfig.textAlignment};
            padding: 10px;
        }
        
        .product-image {
            width: ${gridConfig.imageSize}px;
            height: ${gridConfig.imageSize}px;
            object-fit: cover;
            border-radius: ${designConfig.borderRadius}px;
            margin-bottom: 8px;
        }
        
        .product-name {
            font-size: ${designConfig.titleFontSize}px;
            color: ${designConfig.textColor};
            font-weight: 600;
            margin-bottom: 5px;
            line-height: 1.2;
            max-width: ${gridConfig.imageSize}px;
        }
        
        .product-price {
            font-size: ${designConfig.priceFontSize}px;
            color: ${designConfig.priceColor};
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .product-unit {
            font-size: ${designConfig.descriptionFontSize}px;
            color: ${designConfig.textColor};
        }
        
        .product-promo {
            background-color: ${designConfig.primaryColor};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: ${designConfig.descriptionFontSize - 2}px;
            margin-top: 3px;
        }
        
        .product-footer {
            font-size: ${designConfig.descriptionFontSize}px;
            color: ${designConfig.secondaryColor};
            margin-top: 3px;
        }
        
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: ${designConfig.descriptionFontSize}px;
            color: ${designConfig.secondaryColor};
        }
        
        .empty-space {
            /* Espaço vazio para centralização */
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            ${atacadoLogo ? `<img src="${atacadoLogo}" alt="Logo Atacado" class="logo-atacado">` : '<div></div>'}
            ${ofertaLogo ? `<img src="${ofertaLogo}" alt="Logo Oferta" class="logo-oferta">` : '<div></div>'}
        </div>
        
        <div class="products-grid">
            ${productGridHTML}
        </div>
        
        <div class="footer">
            ${getValidityText()}
            ${totalCards > 1 ? `<br><small>Card ${cardIndex} de ${totalCards}</small>` : ''}
        </div>
    </div>
</body>
</html>`;
}

function generateProductHTML(
  product: Product,
  gridConfig: GridConfig,
  designConfig: DesignConfig
): string {
  const formatPrice = (preco: string | number, centavos: string | number) => {
    const precoNum = typeof preco === "string" ? parseFloat(preco) || 0 : preco;
    const centavosNum = typeof centavos === "string" ? parseFloat(centavos) || 0 : centavos;
    return `R$ ${precoNum},${centavosNum.toString().padStart(2, "0")}`;
  };

  return `
    <div class="product">
        ${product.imagem 
          ? `<img src="${product.imagem}" alt="${product.nome}" class="product-image">` 
          : `<div class="product-image" style="background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">Sem imagem</div>`
        }
        <div class="product-name">${product.nome}</div>
        <div class="product-price">
            ${formatPrice(product.preco, product.centavos)}
            <span class="product-unit">/${product.unidade}</span>
        </div>
        ${product.promo ? '<div class="product-promo">PROMO</div>' : ''}
        ${product.rodapeTipo && product.rodapeQuantidade 
          ? `<div class="product-footer">${product.rodapeTipo === "comprando" ? "Comprando" : "Limite"}: ${product.rodapeQuantidade}</div>` 
          : ''
        }
    </div>`;
}
