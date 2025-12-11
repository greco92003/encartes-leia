"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Slider } from "@/components/ui/slider"; // Não disponível
import {
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
} from "lucide-react";

export interface DesignConfig {
  // Cores
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  priceColor: string;

  // Tipografia
  titleFontSize: number;
  priceFontSize: number;
  descriptionFontSize: number;
  fontFamily: "Arial" | "Helvetica" | "Georgia" | "Times" | "Courier";

  // Layout
  textAlignment: "left" | "center" | "right";
  logoPosition: "top-left" | "top-center" | "top-right";
  padding: number;
  borderRadius: number;

  // Efeitos
  shadow: boolean;
  border: boolean;
  borderColor: string;
}

interface CardDesignEditorProps {
  config: DesignConfig;
  onConfigChange: (config: DesignConfig) => void;
}

export function CardDesignEditor({
  config,
  onConfigChange,
}: CardDesignEditorProps) {
  const updateConfig = (updates: Partial<DesignConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const resetToDefaults = () => {
    const defaultConfig: DesignConfig = {
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
    };
    onConfigChange(defaultConfig);
  };

  const colorPresets = [
    {
      name: "Clássico",
      bg: "#ffffff",
      primary: "#dc2626",
      secondary: "#1f2937",
    },
    {
      name: "Moderno",
      bg: "#f8fafc",
      primary: "#3b82f6",
      secondary: "#64748b",
    },
    {
      name: "Elegante",
      bg: "#1f2937",
      primary: "#fbbf24",
      secondary: "#f3f4f6",
    },
    {
      name: "Natural",
      bg: "#f0fdf4",
      primary: "#059669",
      secondary: "#374151",
    },
    {
      name: "Vibrante",
      bg: "#fef3c7",
      primary: "#f59e0b",
      secondary: "#7c2d12",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Editor de Design</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Resetar
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Personalize a aparência dos seus cards
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Presets de Cores */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Presets de Cores</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {colorPresets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-auto p-2 flex flex-col items-center space-y-1"
                onClick={() =>
                  updateConfig({
                    backgroundColor: preset.bg,
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary,
                  })
                }
              >
                <div className="flex space-x-1">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: preset.bg }}
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <span className="text-xs">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Cores Personalizadas */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Cores Personalizadas</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Fundo</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) =>
                    updateConfig({ backgroundColor: e.target.value })
                  }
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={config.backgroundColor}
                  onChange={(e) =>
                    updateConfig({ backgroundColor: e.target.value })
                  }
                  className="flex-1 text-xs"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Cor Principal</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) =>
                    updateConfig({ primaryColor: e.target.value })
                  }
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) =>
                    updateConfig({ primaryColor: e.target.value })
                  }
                  className="flex-1 text-xs"
                  placeholder="#dc2626"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Cor Secundária</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) =>
                    updateConfig({ secondaryColor: e.target.value })
                  }
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={config.secondaryColor}
                  onChange={(e) =>
                    updateConfig({ secondaryColor: e.target.value })
                  }
                  className="flex-1 text-xs"
                  placeholder="#1f2937"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Cor do Texto</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.textColor}
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={config.textColor}
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                  className="flex-1 text-xs"
                  placeholder="#111827"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Cor do Preço</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.priceColor}
                  onChange={(e) => updateConfig({ priceColor: e.target.value })}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={config.priceColor}
                  onChange={(e) => updateConfig({ priceColor: e.target.value })}
                  className="flex-1 text-xs"
                  placeholder="#059669"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Cor da Borda</Label>
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={config.borderColor}
                  onChange={(e) =>
                    updateConfig({ borderColor: e.target.value })
                  }
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={config.borderColor}
                  onChange={(e) =>
                    updateConfig({ borderColor: e.target.value })
                  }
                  className="flex-1 text-xs"
                  placeholder="#e5e7eb"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tipografia */}
        <div className="space-y-4">
          <Label className="text-sm font-medium flex items-center space-x-2">
            <Type className="w-4 h-4" />
            <span>Tipografia</span>
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-xs">Família da Fonte</Label>
              <RadioGroup
                value={config.fontFamily}
                onValueChange={(value) =>
                  updateConfig({ fontFamily: value as any })
                }
                className="grid grid-cols-2 gap-2"
              >
                {["Arial", "Helvetica", "Georgia", "Times", "Courier"].map(
                  (font) => (
                    <div key={font} className="flex items-center space-x-2">
                      <RadioGroupItem value={font} id={`font-${font}`} />
                      <Label
                        htmlFor={`font-${font}`}
                        className="text-xs cursor-pointer"
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </Label>
                    </div>
                  )
                )}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-xs">Alinhamento do Texto</Label>
              <RadioGroup
                value={config.textAlignment}
                onValueChange={(value) =>
                  updateConfig({ textAlignment: value as any })
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="align-left" />
                  <Label htmlFor="align-left" className="cursor-pointer">
                    <AlignLeft className="w-4 h-4" />
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="center" id="align-center" />
                  <Label htmlFor="align-center" className="cursor-pointer">
                    <AlignCenter className="w-4 h-4" />
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="align-right" />
                  <Label htmlFor="align-right" className="cursor-pointer">
                    <AlignRight className="w-4 h-4" />
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">
                Tamanho do Título: {config.titleFontSize}px
              </Label>
              <input
                type="range"
                value={config.titleFontSize}
                onChange={(e) =>
                  updateConfig({ titleFontSize: parseInt(e.target.value) })
                }
                min={12}
                max={32}
                step={1}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Tamanho do Preço: {config.priceFontSize}px
              </Label>
              <input
                type="range"
                value={config.priceFontSize}
                onChange={(e) =>
                  updateConfig({ priceFontSize: parseInt(e.target.value) })
                }
                min={16}
                max={48}
                step={1}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Tamanho da Descrição: {config.descriptionFontSize}px
              </Label>
              <input
                type="range"
                value={config.descriptionFontSize}
                onChange={(e) =>
                  updateConfig({
                    descriptionFontSize: parseInt(e.target.value),
                  })
                }
                min={10}
                max={20}
                step={1}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
