"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridConfig } from "./card-grid-config";
import { DesignConfig } from "./card-design-editor";

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

interface CardPreviewProps {
  products: Product[];
  gridConfig: GridConfig;
  designConfig: DesignConfig;
  atacadoLogo?: string;
  ofertaLogo?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export function CardPreview({
  products,
  gridConfig,
  designConfig,
  atacadoLogo,
  ofertaLogo,
  dateRange,
}: CardPreviewProps) {
  
  const formatPrice = (preco: string | number, centavos: string | number) => {
    const precoNum = typeof preco === "string" ? parseFloat(preco) || 0 : preco;
    const centavosNum = typeof centavos === "string" ? parseFloat(centavos) || 0 : centavos;
    
    return `R$ ${precoNum},${centavosNum.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR");
  };

  const getValidityText = () => {
    if (dateRange?.from && dateRange?.to) {
      return `Válido de ${formatDate(dateRange.from)} até ${formatDate(dateRange.to)}`;
    }
    return "Período de validade não definido";
  };

  // Calcular distribuição dos produtos
  const { productsPerRow, numberOfRows } = gridConfig;
  const fullRows = Math.floor(products.length / productsPerRow);
  const remainingProducts = products.length % productsPerRow;

  const renderProductGrid = () => {
    const rows = [];
    let productIndex = 0;

    // Linhas completas
    for (let row = 0; row < fullRows && row < numberOfRows; row++) {
      const rowProducts = [];
      for (let col = 0; col < productsPerRow; col++) {
        if (productIndex < products.length) {
          rowProducts.push(products[productIndex]);
          productIndex++;
        }
      }
      rows.push(renderProductRow(rowProducts, `row-${row}`, false));
    }

    // Linha com produtos restantes (centralizada)
    if (remainingProducts > 0 && fullRows < numberOfRows) {
      const remainingProductsArray = [];
      for (let i = 0; i < remainingProducts; i++) {
        if (productIndex < products.length) {
          remainingProductsArray.push(products[productIndex]);
          productIndex++;
        }
      }
      rows.push(renderProductRow(remainingProductsArray, "remaining-row", true));
    }

    return rows;
  };

  const renderProductRow = (rowProducts: Product[], key: string, isCentered: boolean) => {
    const emptySpaces = isCentered ? Math.floor((productsPerRow - rowProducts.length) / 2) : 0;
    const cells = [];

    // Espaços vazios para centralizar
    for (let i = 0; i < emptySpaces; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }

    // Produtos
    rowProducts.forEach((product, index) => {
      cells.push(
        <div
          key={`product-${index}`}
          className="flex flex-col items-center space-y-2 p-2"
          style={{
            fontFamily: designConfig.fontFamily,
            textAlign: designConfig.textAlignment,
          }}
        >
          {/* Imagem do produto */}
          <div
            className="bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden"
            style={{
              width: gridConfig.imageSize,
              height: gridConfig.imageSize,
              backgroundColor: designConfig.backgroundColor,
              border: designConfig.border ? `1px solid ${designConfig.borderColor}` : "none",
              borderRadius: designConfig.borderRadius,
            }}
          >
            {product.imagem ? (
              <img
                src={product.imagem}
                alt={product.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-xs">Sem imagem</div>
            )}
          </div>

          {/* Nome do produto */}
          <div
            className="font-medium leading-tight"
            style={{
              fontSize: designConfig.titleFontSize,
              color: designConfig.textColor,
              maxWidth: gridConfig.imageSize,
            }}
          >
            {product.nome}
          </div>

          {/* Preço */}
          <div
            className="font-bold"
            style={{
              fontSize: designConfig.priceFontSize,
              color: designConfig.priceColor,
            }}
          >
            {formatPrice(product.preco, product.centavos)}
            <span
              className="text-sm ml-1"
              style={{
                fontSize: designConfig.descriptionFontSize,
                color: designConfig.textColor,
              }}
            >
              /{product.unidade}
            </span>
          </div>

          {/* Badge de promoção */}
          {product.promo && (
            <Badge
              className="text-xs"
              style={{
                backgroundColor: designConfig.primaryColor,
                color: "white",
              }}
            >
              PROMO
            </Badge>
          )}

          {/* Rodapé (comprando/limite) */}
          {product.rodapeTipo && product.rodapeQuantidade && (
            <div
              className="text-xs"
              style={{
                fontSize: designConfig.descriptionFontSize,
                color: designConfig.secondaryColor,
              }}
            >
              {product.rodapeTipo === "comprando" ? "Comprando" : "Limite"}: {product.rodapeQuantidade}
            </div>
          )}
        </div>
      );
    });

    // Espaços vazios restantes
    const remainingEmptySpaces = productsPerRow - emptySpaces - rowProducts.length;
    for (let i = 0; i < remainingEmptySpaces; i++) {
      cells.push(<div key={`empty-end-${i}`} />);
    }

    return (
      <div
        key={key}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${productsPerRow}, 1fr)` }}
      >
        {cells}
      </div>
    );
  };

  const cardStyle = {
    width: gridConfig.cardWidth / 4, // Escala reduzida para preview
    height: gridConfig.cardHeight / 4,
    backgroundColor: designConfig.backgroundColor,
    border: designConfig.border ? `1px solid ${designConfig.borderColor}` : "none",
    borderRadius: designConfig.borderRadius,
    boxShadow: designConfig.shadow ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
    padding: designConfig.padding / 2, // Padding proporcional
    fontFamily: designConfig.fontFamily,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Preview do Card</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Maximize2 className="w-4 h-4 mr-1" />
              Ampliar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Baixar
            </Button>
          </div>
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Escala: 25%</span>
          <Badge variant="outline">
            {gridConfig.cardSize === "1080x1080" ? "Quadrado" : "Story"}
          </Badge>
          <span>{products.length} produtos</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div
            className="relative overflow-hidden"
            style={cardStyle}
          >
            {/* Header com logos */}
            <div className="flex items-center justify-between mb-4">
              {/* Logo do atacado */}
              {atacadoLogo && (
                <img
                  src={atacadoLogo}
                  alt="Logo Atacado"
                  className="h-8 object-contain"
                />
              )}
              
              {/* Logo da oferta */}
              {ofertaLogo && (
                <img
                  src={ofertaLogo}
                  alt="Logo Oferta"
                  className="h-6 object-contain"
                />
              )}
            </div>

            {/* Grid de produtos */}
            <div className="space-y-2 flex-1">
              {renderProductGrid()}
            </div>

            {/* Footer com validade */}
            <div
              className="mt-4 text-center text-xs"
              style={{
                fontSize: designConfig.descriptionFontSize / 2,
                color: designConfig.secondaryColor,
              }}
            >
              {getValidityText()}
            </div>
          </div>
        </div>

        {/* Informações do preview */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Preview em escala reduzida. O card final terá {gridConfig.cardWidth}x{gridConfig.cardHeight}px</p>
        </div>
      </CardContent>
    </Card>
  );
}
