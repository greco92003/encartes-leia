"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Package,
  Palette,
  Upload,
  Settings,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { LogoSelector } from "@/components/logo-selector";
import { CardGridConfig, GridConfig } from "@/components/card-grid-config";
import {
  CardDesignEditor,
  DesignConfig,
} from "@/components/card-design-editor";
import { CardPreview } from "@/components/card-preview";

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

interface CardData {
  products: Product[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  formType: string;
  timestamp: string;
}

export default function CreateCards() {
  const router = useRouter();
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para logos
  const [selectedAtacadoLogo, setSelectedAtacadoLogo] = useState<string | null>(
    null
  );
  const [selectedOfertaLogo, setSelectedOfertaLogo] = useState<string | null>(
    null
  );

  // Estado para configuração do grid
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    productsPerRow: 2,
    numberOfRows: 2,
    totalProducts: 4,
    cardSize: "1080x1080",
    cardWidth: 1080,
    cardHeight: 1080,
    imageSize: 288, // Calculado: (1080-120)/2 * 0.6 ≈ 288
  });

  // Estado para configuração de design
  const [designConfig, setDesignConfig] = useState<DesignConfig>({
    backgroundColor: "#ffffff",
    primaryColor: "#dc2626",
    secondaryColor: "#1f2937",
    textColor: "#111827",
    priceColor: "#059669",
    titleFontSize: 18,
    priceFontSize: 24,
    descriptionFontSize: 14,
    fontFamily: "Arial",
    textAlignment: "center",
    logoPosition: "top-center",
    padding: 16,
    borderRadius: 8,
    shadow: true,
    border: false,
    borderColor: "#e5e7eb",
  });

  useEffect(() => {
    // Carregar dados do localStorage
    const loadCardData = () => {
      try {
        const savedData = localStorage.getItem("cardGeneratorData");
        if (!savedData) {
          toast.error("Nenhum dado encontrado. Redirecionando...");
          router.push("/distribuidora");
          return;
        }

        const parsedData = JSON.parse(savedData);

        // Converter strings de data de volta para objetos Date
        if (parsedData.dateRange) {
          if (parsedData.dateRange.from) {
            parsedData.dateRange.from = new Date(parsedData.dateRange.from);
          }
          if (parsedData.dateRange.to) {
            parsedData.dateRange.to = new Date(parsedData.dateRange.to);
          }
        }

        setCardData(parsedData);
        setIsLoading(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados. Redirecionando...");
        router.push("/distribuidora");
      }
    };

    loadCardData();
  }, [router]);

  const formatPrice = (preco: string | number, centavos: string | number) => {
    const precoNum = typeof preco === "string" ? parseFloat(preco) || 0 : preco;
    const centavosNum =
      typeof centavos === "string" ? parseFloat(centavos) || 0 : centavos;

    return `R$ ${precoNum},${centavosNum.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR");
  };

  const getFormTypeTitle = (formType: string) => {
    switch (formType) {
      case "distribuidora":
        return "Distribuidora";
      case "meat":
        return "Especial das Carnes";
      case "hortiFruti":
        return "Horti-Fruti";
      default:
        return "Ofertas";
    }
  };

  // Callbacks para upload de logos
  const handleAtacadoLogoUpload = (url: string, fileName: string) => {
    setSelectedAtacadoLogo(url);
    toast.success(`Logo do atacado "${fileName}" selecionado!`);
  };

  const handleOfertaLogoUpload = (url: string, fileName: string) => {
    setSelectedOfertaLogo(url);
    toast.success(`Logo da oferta "${fileName}" selecionado!`);
  };

  // Função para gerar e baixar cards
  const handleGenerateCards = async () => {
    if (!cardData || !selectedAtacadoLogo || !selectedOfertaLogo) {
      toast.error("Dados incompletos para gerar cards");
      return;
    }

    try {
      toast.info("Gerando cards... Isso pode levar alguns segundos.");

      const response = await fetch("/api/generate-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: cardData.products,
          gridConfig,
          designConfig,
          atacadoLogo: selectedAtacadoLogo,
          ofertaLogo: selectedOfertaLogo,
          dateRange: cardData.dateRange,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `${result.data.totalCards} card(s) gerado(s) com sucesso!`
        );

        // Baixar cada card como arquivo HTML
        result.data.cards.forEach((card: any, index: number) => {
          const blob = new Blob([card.html], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `card-${card.index}-${cardData.formType}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

        toast.success("Download dos cards iniciado!");
      } else {
        throw new Error(result.error || "Erro ao gerar cards");
      }
    } catch (error) {
      console.error("Erro ao gerar cards:", error);
      toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Nenhum dado encontrado</h1>
          <Button onClick={() => router.push("/distribuidora")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Distribuidora
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img
          src="/logo-leia.png"
          alt="Logo Atacado Léia"
          className="h-24 mb-4"
        />
        <h1 className="text-3xl font-bold text-center mb-2">
          Gerador de Cards
        </h1>
        <p className="text-gray-600 text-center">
          Crie cards personalizados para suas ofertas
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/distribuidora")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para {getFormTypeTitle(cardData.formType)}
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Produtos Selecionados</p>
                <p className="text-2xl font-bold">{cardData.products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Período de Validade</p>
                <p className="text-sm font-medium">
                  {cardData.dateRange.from && cardData.dateRange.to
                    ? `${formatDate(cardData.dateRange.from)} - ${formatDate(
                        cardData.dateRange.to
                      )}`
                    : "Não definido"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tipo de Oferta</p>
                <p className="text-sm font-medium">
                  {getFormTypeTitle(cardData.formType)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Produtos Selecionados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardData.products.map((product, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-sm">{product.nome}</h3>
                  {product.promo && (
                    <Badge variant="destructive" className="text-xs">
                      PROMO
                    </Badge>
                  )}
                </div>

                <div className="text-lg font-bold text-green-600">
                  {formatPrice(product.preco, product.centavos)}
                  <span className="text-sm text-gray-500 ml-1">
                    /{product.unidade}
                  </span>
                </div>

                {product.imagem && (
                  <div className="text-xs text-gray-500">
                    📷 Imagem: {product.imagem.substring(0, 30)}...
                  </div>
                )}

                {product.rodapeTipo && product.rodapeQuantidade && (
                  <div className="text-xs text-blue-600">
                    {product.rodapeTipo === "comprando"
                      ? "Comprando"
                      : "Limite"}
                    : {product.rodapeQuantidade}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logo Management Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Gerenciar Logos</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Faça upload e selecione os logos que serão usados nos cards
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo do Atacado */}
            <LogoSelector
              bucketType="logos-atacado"
              title="Logo do Atacado"
              description="Logo principal da empresa (ex: logo Léia)"
              selectedLogo={selectedAtacadoLogo}
              onLogoSelect={handleAtacadoLogoUpload}
            />

            {/* Logo da Oferta */}
            <LogoSelector
              bucketType="logos-ofertas"
              title="Logo da Oferta"
              description="Logo específico da oferta (ex: HORTI FRUTI, ESPECIAL DAS CARNES)"
              selectedLogo={selectedOfertaLogo}
              onLogoSelect={handleOfertaLogoUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid Configuration Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações do Layout</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure como os produtos serão organizados nos cards
          </p>
        </CardHeader>
        <CardContent>
          <CardGridConfig
            config={gridConfig}
            onConfigChange={setGridConfig}
            maxProducts={cardData?.products.length || 0}
          />
        </CardContent>
      </Card>

      {/* Design Configuration Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Personalização Visual</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Customize cores, fontes e estilos dos seus cards
          </p>
        </CardHeader>
        <CardContent>
          <CardDesignEditor
            config={designConfig}
            onConfigChange={setDesignConfig}
          />
        </CardContent>
      </Card>

      {/* Preview Section */}
      {selectedAtacadoLogo && selectedOfertaLogo && cardData && (
        <Card className="mb-6">
          <CardContent className="p-0">
            <CardPreview
              products={cardData.products}
              gridConfig={gridConfig}
              designConfig={designConfig}
              atacadoLogo={selectedAtacadoLogo}
              ofertaLogo={selectedOfertaLogo}
              dateRange={cardData.dateRange}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          className="flex-1 bg-green-600 text-white hover:bg-green-700"
          size="lg"
          disabled={
            !selectedAtacadoLogo ||
            !selectedOfertaLogo ||
            !cardData?.products.length
          }
          onClick={handleGenerateCards}
        >
          <Download className="w-5 h-5 mr-2" />
          Gerar e Baixar Cards
        </Button>

        <Button
          variant="outline"
          className="flex-1"
          size="lg"
          disabled={!selectedAtacadoLogo || !selectedOfertaLogo}
        >
          <Settings className="w-5 h-5 mr-2" />
          Configurações Avançadas
        </Button>
      </div>

      {(!selectedAtacadoLogo || !selectedOfertaLogo) && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Selecione ambos os logos para visualizar o preview e gerar os cards
        </div>
      )}

      {selectedAtacadoLogo &&
        selectedOfertaLogo &&
        !cardData?.products.length && (
          <div className="text-center text-sm text-yellow-600 mt-4">
            ⚠️ Nenhum produto encontrado. Volte para a distribuidora e adicione
            produtos.
          </div>
        )}
    </div>
  );
}
