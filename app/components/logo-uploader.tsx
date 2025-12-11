"use client";

import React, { useState } from "react";
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileInput,
} from "@/components/extension/file-upload";
import {
  Upload,
  Check,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Building2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

interface LogoUploaderProps {
  bucketType: "logos-atacado" | "logos-ofertas";
  title: string;
  description: string;
  onUploadSuccess?: (url: string, fileName: string) => void;
}

const FileSvgDraw = () => {
  return (
    <>
      <svg
        className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Clique para fazer upload</span>
        &nbsp; ou arraste e solte
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        PNG, JPG, GIF ou WEBP (máx. 5MB)
      </p>
    </>
  );
};

export function LogoUploader({ 
  bucketType, 
  title, 
  description, 
  onUploadSuccess 
}: LogoUploaderProps) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      fileName: string;
      publicUrl: string;
      success: boolean;
      errorMessage?: string;
    }[]
  >([]);

  const dropZoneConfig = {
    maxFiles: 5,
    maxSize: 1024 * 1024 * 5, // 5MB
    multiple: true,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
  };

  const uploadToSupabase = async (file: File): Promise<{
    fileName: string;
    publicUrl: string;
    success: boolean;
    errorMessage?: string;
  }> => {
    try {
      // Gerar nome único para o arquivo
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split(".").pop();
      const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`;

      // Upload para o bucket específico
      const { data, error } = await supabase.storage
        .from(bucketType)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucketType)
        .getPublicUrl(data.path);

      return {
        fileName: file.name,
        publicUrl: urlData.publicUrl,
        success: true,
      };
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      return {
        fileName: file.name,
        publicUrl: "",
        success: false,
        errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast.error("Selecione pelo menos um arquivo para fazer upload.");
      return;
    }

    setUploading(true);
    try {
      console.log(`Iniciando upload de ${files.length} arquivo(s) para ${bucketType}...`);

      const results = await Promise.all(
        files.map(file => uploadToSupabase(file))
      );

      setUploadedFiles(results);
      setFiles(null);

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        toast.error(
          `Upload parcialmente concluído: ${successCount} sucesso(s), ${failedCount} falha(s)`
        );
      } else {
        toast.success(`${successCount} logo(s) enviado(s) com sucesso!`);
        
        // Chamar callback para cada upload bem-sucedido
        results.forEach(result => {
          if (result.success && onUploadSuccess) {
            onUploadSuccess(result.publicUrl, result.fileName);
          }
        });
      }
    } catch (error) {
      console.error("Erro geral no upload:", error);
      toast.error("Erro ao fazer upload dos arquivos. Tente novamente.");
    } finally {
      setUploading(false);
    }
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
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUploader
          value={files}
          onValueChange={setFiles}
          dropzoneOptions={dropZoneConfig}
          className="relative bg-background rounded-lg p-2"
        >
          <FileInput className="outline-dashed outline-1 outline-slate-500">
            <div className="flex items-center justify-center flex-col p-8 w-full">
              <FileSvgDraw />
            </div>
          </FileInput>
          <FileUploaderContent>
            {files &&
              files.length > 0 &&
              files.map((file, i) => (
                <FileUploaderItem key={i} index={i}>
                  <ImageIcon className="h-4 w-4 stroke-current" />
                  <span>{file.name}</span>
                </FileUploaderItem>
              ))}
          </FileUploaderContent>
        </FileUploader>

        {files && files.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full ${
              bucketType === "logos-atacado"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar {files.length} arquivo(s)
              </>
            )}
          </Button>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Resultados do Upload:</h4>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded border ${
                  file.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {file.success ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">{file.fileName}</span>
                </div>
                {file.success ? (
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    Sucesso
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-700 border-red-200">
                    Erro
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
