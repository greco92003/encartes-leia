"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Grid3X3, LayoutGrid, Calculator } from "lucide-react";

export interface GridConfig {
  productsPerRow: 1 | 2 | 3 | 4;
  numberOfRows: 1 | 2 | 3;
  totalProducts: number;
  cardSize: "1080x1080" | "1080x1920";
  cardWidth: number;
  cardHeight: number;
  imageSize: number;
}

interface CardGridConfigProps {
  config: GridConfig;
  onConfigChange: (config: GridConfig) => void;
  maxProducts: number;
}

export function CardGridConfig({
  config,
  onConfigChange,
  maxProducts,
}: CardGridConfigProps) {
  const calculateDimensions = (
    productsPerRow: number,
    numberOfRows: number,
    cardSize: "1080x1080" | "1080x1920"
  ) => {
    // Dimensões fixas do card
    const cardDimensions = {
      "1080x1080": { cardWidth: 1080, cardHeight: 1080 },
      "1080x1920": { cardWidth: 1080, cardHeight: 1920 },
    };

    // Calcular tamanho da imagem baseado no grid e tamanho do card
    const { cardWidth, cardHeight } = cardDimensions[cardSize];

    // Área disponível para produtos (considerando padding e espaços)
    const availableWidth = cardWidth - 120; // 60px padding de cada lado
    const availableHeight = cardHeight - 200; // espaço para logos e informações

    // Tamanho de cada célula do produto
    const cellWidth = availableWidth / productsPerRow;
    const cellHeight = availableHeight / numberOfRows;

    // Tamanho da imagem (60% da célula menor)
    const imageSize = Math.min(cellWidth, cellHeight) * 0.6;

    return {
      cardWidth,
      cardHeight,
      imageSize: Math.round(imageSize),
    };
  };

  const handleProductsPerRowChange = (value: string) => {
    const productsPerRow = parseInt(value) as 1 | 2 | 3 | 4;
    const totalProducts = productsPerRow * config.numberOfRows;
    const dimensions = calculateDimensions(
      productsPerRow,
      config.numberOfRows,
      config.cardSize
    );

    onConfigChange({
      ...config,
      productsPerRow,
      totalProducts,
      ...dimensions,
    });
  };

  const handleNumberOfRowsChange = (value: string) => {
    const numberOfRows = parseInt(value) as 1 | 2 | 3;
    const totalProducts = config.productsPerRow * numberOfRows;
    const dimensions = calculateDimensions(
      config.productsPerRow,
      numberOfRows,
      config.cardSize
    );

    onConfigChange({
      ...config,
      numberOfRows,
      totalProducts,
      ...dimensions,
    });
  };

  const handleCardSizeChange = (value: string) => {
    const cardSize = value as "1080x1080" | "1080x1920";
    const dimensions = calculateDimensions(
      config.productsPerRow,
      config.numberOfRows,
      cardSize
    );

    onConfigChange({
      ...config,
      cardSize,
      ...dimensions,
    });
  };

  const getGridPreview = () => {
    const { productsPerRow, numberOfRows } = config;
    const availableProducts = maxProducts;

    // Calcular distribuição inteligente
    const fullRows = Math.floor(availableProducts / productsPerRow);
    const remainingProducts = availableProducts % productsPerRow;

    const rows = [];

    // Linhas completas
    for (let row = 0; row < fullRows && row < numberOfRows; row++) {
      const rowCells = [];
      for (let col = 0; col < productsPerRow; col++) {
        const productIndex = row * productsPerRow + col + 1;
        rowCells.push(
          <div
            key={`${row}-${col}`}
            className="aspect-square bg-blue-200 rounded flex items-center justify-center text-xs font-medium"
          >
            {productIndex}
          </div>
        );
      }
      rows.push(
        <div
          key={row}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${productsPerRow}, 1fr)` }}
        >
          {rowCells}
        </div>
      );
    }

    // Linha com produtos restantes (centralizada)
    if (remainingProducts > 0 && fullRows < numberOfRows) {
      const rowCells = [];
      const startIndex = fullRows * productsPerRow;

      // Adicionar espaços vazios para centralizar
      const emptySpaces = Math.floor((productsPerRow - remainingProducts) / 2);

      for (let i = 0; i < emptySpaces; i++) {
        rowCells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
      }

      // Adicionar produtos restantes
      for (let i = 0; i < remainingProducts; i++) {
        const productIndex = startIndex + i + 1;
        rowCells.push(
          <div
            key={`remaining-${i}`}
            className="aspect-square bg-green-200 rounded flex items-center justify-center text-xs font-medium"
          >
            {productIndex}
          </div>
        );
      }

      // Adicionar espaços vazios restantes
      const remainingEmptySpaces =
        productsPerRow - emptySpaces - remainingProducts;
      for (let i = 0; i < remainingEmptySpaces; i++) {
        rowCells.push(
          <div key={`empty-end-${i}`} className="aspect-square"></div>
        );
      }

      rows.push(
        <div
          key="remaining"
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${productsPerRow}, 1fr)` }}
        >
          {rowCells}
        </div>
      );
    }

    // Linhas vazias restantes
    const remainingRows = numberOfRows - rows.length;
    for (let row = 0; row < remainingRows; row++) {
      const rowCells = [];
      for (let col = 0; col < productsPerRow; col++) {
        rowCells.push(
          <div
            key={`empty-row-${row}-${col}`}
            className="aspect-square bg-gray-200 rounded opacity-50"
          ></div>
        );
      }
      rows.push(
        <div
          key={`empty-row-${row}`}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${productsPerRow}, 1fr)` }}
        >
          {rowCells}
        </div>
      );
    }

    return <div className="space-y-1 p-2 bg-gray-100 rounded">{rows}</div>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <LayoutGrid className="w-5 h-5" />
          <span>Configuração do Grid</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure o layout dos produtos nos cards
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Produtos por Linha */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Produtos por Linha</Label>
          <RadioGroup
            value={config.productsPerRow.toString()}
            onValueChange={handleProductsPerRowChange}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center space-x-2">
                <RadioGroupItem value={num.toString()} id={`products-${num}`} />
                <Label
                  htmlFor={`products-${num}`}
                  className="text-sm cursor-pointer"
                >
                  {num} produto{num > 1 ? "s" : ""}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Tamanho do Card */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tamanho do Card</Label>
          <RadioGroup
            value={config.cardSize}
            onValueChange={handleCardSizeChange}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1080x1080" id="size-square" />
              <Label htmlFor="size-square" className="text-sm cursor-pointer">
                1080x1080 (Quadrado)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1080x1920" id="size-story" />
              <Label htmlFor="size-story" className="text-sm cursor-pointer">
                1080x1920 (Story)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Número de Linhas */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Número de Linhas</Label>
          <RadioGroup
            value={config.numberOfRows.toString()}
            onValueChange={handleNumberOfRowsChange}
            className="grid grid-cols-3 gap-4"
          >
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center space-x-2">
                <RadioGroupItem value={num.toString()} id={`rows-${num}`} />
                <Label
                  htmlFor={`rows-${num}`}
                  className="text-sm cursor-pointer"
                >
                  {num} linha{num > 1 ? "s" : ""}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Preview do Grid */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Grid3X3 className="w-4 h-4" />
            <span>Preview do Layout</span>
          </Label>
          <div className="max-w-xs">{getGridPreview()}</div>
        </div>

        {/* Informações Calculadas */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Calculator className="w-4 h-4" />
            <span>Dimensões Calculadas</span>
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total de Produtos:</span>
                <Badge variant="outline">{config.totalProducts}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Produtos Disponíveis:</span>
                <Badge
                  variant={
                    config.totalProducts <= maxProducts
                      ? "default"
                      : "destructive"
                  }
                >
                  {maxProducts}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Formato:</span>
                <Badge variant="secondary">
                  {config.cardSize === "1080x1080" ? "Quadrado" : "Story"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tamanho do Card:</span>
                <span className="text-xs font-mono">
                  {config.cardWidth}x{config.cardHeight}px
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tamanho da Imagem:</span>
                <span className="text-xs font-mono">
                  {config.imageSize}x{config.imageSize}px
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso se não há produtos suficientes */}
        {config.totalProducts > maxProducts && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Você selecionou {config.totalProducts} produtos para o grid,
              mas apenas {maxProducts} produtos estão disponíveis.
              {maxProducts > 0 &&
                " Os cards serão preenchidos com os produtos disponíveis."}
            </p>
          </div>
        )}

        {/* Informações sobre distribuição inteligente */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            🎯 <strong>Distribuição Inteligente:</strong> Quando sobram
            produtos, eles são automaticamente centralizados. No preview: azul =
            linhas completas, verde = produtos centralizados, cinza = espaços
            vazios.
          </p>
        </div>

        {/* Informações sobre otimização */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> Grids menores (1-2 produtos por linha) são
            ideais para destacar produtos em promoção. Grids maiores (3-4
            produtos) são melhores para catálogos com muitos itens.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
