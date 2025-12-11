"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  RefreshCw,
  Check,
  Building2,
  Tag,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { LogoUploader } from "./logo-uploader";

interface LogoFile {
  name: string;
  publicUrl: string;
  created_at: string;
  size: number;
}

interface LogoSelectorProps {
  bucketType: "logos-atacado" | "logos-ofertas";
  title: string;
  description: string;
  selectedLogo: string | null;
  onLogoSelect: (url: string, fileName: string) => void;
}

export function LogoSelector({
  bucketType,
  title,
  description,
  selectedLogo,
  onLogoSelect,
}: LogoSelectorProps) {
  const [logos, setLogos] = useState<LogoFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const loadLogos = async () => {
    setIsLoading(true);
    try {
      const { data: files, error } = await supabase.storage
        .from(bucketType)
        .list("", {
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        throw error;
      }

      // Filtrar apenas arquivos de imagem e obter URLs públicas
      const logoFiles: LogoFile[] = [];

      for (const file of files) {
        if (file.name && file.name !== ".emptyFolderPlaceholder") {
          const { data: urlData } = supabase.storage
            .from(bucketType)
            .getPublicUrl(file.name);

          logoFiles.push({
            name: file.name,
            publicUrl: urlData.publicUrl,
            created_at: file.created_at || "",
            size: file.metadata?.size || 0,
          });
        }
      }

      setLogos(logoFiles);

      if (logoFiles.length === 0) {
        toast.info(`Nenhum logo encontrado no bucket ${bucketType}`);
      }
    } catch (error) {
      console.error("Erro ao carregar logos:", error);
      toast.error("Erro ao carregar logos existentes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogos();
  }, [bucketType]);

  const handleLogoSelect = (logo: LogoFile) => {
    onLogoSelect(logo.publicUrl, logo.name);
    toast.success(`Logo "${logo.name}" selecionado!`);
  };

  const handleUploadSuccess = (url: string, fileName: string) => {
    onLogoSelect(url, fileName);
    setShowUploader(false);
    loadLogos(); // Recarregar a lista após upload
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getBucketIcon = () => {
    return bucketType === "logos-atacado" ? (
      <Building2 className="w-5 h-5" />
    ) : (
      <Tag className="w-5 h-5" />
    );
  };

  const getBucketColor = () => {
    return bucketType === "logos-atacado" ? "blue" : "green";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getBucketIcon()}
          <span>{title}</span>
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`w-fit ${
              bucketType === "logos-atacado"
                ? "border-blue-200 text-blue-700"
                : "border-green-200 text-green-700"
            }`}
          >
            Bucket: {bucketType}
          </Badge>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogos}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploader(!showUploader)}
              className={
                getBucketColor() === "blue"
                  ? "border-blue-200"
                  : "border-green-200"
              }
            >
              <Upload className="w-4 h-4 mr-1" />
              {showUploader ? "Ocultar Upload" : "Novo Upload"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        {showUploader && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <LogoUploader
              bucketType={bucketType}
              title="Upload Novo Logo"
              description="Envie um novo logo para este bucket"
              onUploadSuccess={handleUploadSuccess}
            />
          </div>
        )}

        {/* Existing Logos Section */}
        <div>
          <h4 className="font-medium text-sm mb-3">
            Logos Disponíveis ({logos.length})
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Carregando logos...</span>
            </div>
          ) : logos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum logo encontrado</p>
              <p className="text-xs">Faça upload do primeiro logo</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {logos.map((logo, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                    selectedLogo === logo.publicUrl
                      ? bucketType === "logos-atacado"
                        ? "border-blue-500 bg-blue-50"
                        : "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleLogoSelect(logo)}
                >
                  <div className="aspect-square mb-2 bg-white rounded border flex items-center justify-center overflow-hidden">
                    <img
                      src={logo.publicUrl}
                      alt={logo.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="hidden items-center justify-center w-full h-full text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p
                      className="text-xs font-medium truncate"
                      title={logo.name}
                    >
                      {logo.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(logo.size)}
                    </p>
                    {selectedLogo === logo.publicUrl && (
                      <div className="flex items-center text-xs text-green-600">
                        <Check className="w-3 h-3 mr-1" />
                        Selecionado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Logo Preview */}
        {selectedLogo && (
          <div
            className={`border rounded-lg p-4 ${
              bucketType === "logos-atacado" ? "bg-blue-50" : "bg-green-50"
            }`}
          >
            <h4 className="font-medium text-sm mb-2">Logo Selecionado:</h4>
            <img
              src={selectedLogo}
              alt="Logo Selecionado"
              className="max-h-20 object-contain"
            />
            <p className="text-xs text-gray-600 mt-2">
              Este logo será usado nos cards
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
