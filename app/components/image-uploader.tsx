"use client";

import { useState } from "react";
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileInput,
} from "@/components/extension/file-upload";
import {
  Paperclip,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  Database,
} from "lucide-react";
import {
  uploadImages,
  extractProductNameFromFileName,
} from "@/lib/supabase-upload";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";

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
        Imagem PNG sem fundo
      </p>
    </>
  );
};

export function ImageUploader() {
  const [files, setFiles] = useState<File[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    { fileName: string; publicUrl: string; addedToSheet: boolean }[]
  >([]);

  const dropZoneConfig = {
    maxFiles: 10,
    maxSize: 1024 * 1024 * 4, // 4MB
    multiple: true,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    },
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description:
          "Por favor, selecione pelo menos um arquivo para fazer upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const results = await uploadImages(files);
      setUploadedFiles(results);
      setFiles(null);

      // Contar quantos produtos foram adicionados à planilha
      const addedToSheetCount = results.filter((r) => r.addedToSheet).length;

      toast({
        title: "Upload concluído com sucesso!",
        description: `${results.length} arquivo(s) enviado(s) para o Supabase. ${addedToSheetCount} produto(s) adicionado(s) à planilha.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);

      // Extrair mensagem de erro mais detalhada
      let errorMessage =
        "Ocorreu um erro ao enviar os arquivos. Por favor, tente novamente.";
      if (error && typeof error === "object" && "message" in error) {
        errorMessage = `Erro: ${(error as Error).message}`;
      }

      toast({
        title: "Erro ao fazer upload",
        description: errorMessage,
        variant: "destructive",
        action: (
          <ToastAction altText="Tentar novamente">Tentar novamente</ToastAction>
        ),
      });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link da imagem foi copiado para a área de transferência.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <FileUploader
        value={files}
        onValueChange={setFiles}
        dropzoneOptions={dropZoneConfig}
        className="relative bg-background rounded-lg p-2"
      >
        <FileInput className="outline-dashed outline-1 outline-white">
          <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full">
            <FileSvgDraw />
          </div>
        </FileInput>
        <FileUploaderContent>
          {files &&
            files.length > 0 &&
            files.map((file, i) => (
              <FileUploaderItem key={i} index={i}>
                <Paperclip className="h-4 w-4 stroke-current" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)}KB
                </span>
              </FileUploaderItem>
            ))}
        </FileUploaderContent>
      </FileUploader>

      <Button
        onClick={handleUpload}
        disabled={!files || files.length === 0 || uploading}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Fazer upload
          </>
        )}
      </Button>

      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Arquivos enviados</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex flex-col p-3 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="truncate max-w-[200px] font-medium">
                      {file.fileName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(file.publicUrl)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Copiar link
                    </Button>
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      Abrir
                    </a>
                  </div>
                </div>

                <div className="flex items-center mt-1 text-sm">
                  <div className="flex items-center mr-4">
                    <span className="text-gray-500 mr-2">Nome do produto:</span>
                    <span className="font-medium">
                      {extractProductNameFromFileName(file.fileName)}
                    </span>
                  </div>

                  {file.addedToSheet ? (
                    <Badge
                      variant="outline"
                      className="flex items-center bg-green-50 text-green-700 border-green-200"
                    >
                      <Database className="h-3 w-3 mr-1" />
                      Adicionado à planilha
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center bg-amber-50 text-amber-700 border-amber-200"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Não adicionado à planilha
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
