"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/image-uploader";
import { Navigation } from "@/components/navigation";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase-auth";
import { toast } from "sonner";

export default function UploadPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const user = await getCurrentUser();

        if (!user || user.role !== "admin") {
          toast.error(
            "Acesso restrito. Apenas administradores podem acessar esta página."
          );
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        toast.error(
          "Erro ao verificar permissões. Redirecionando para a página inicial."
        );
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-center">
          <p className="text-lg text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-center mb-2">Acesso Restrito</h1>
        <p className="text-gray-600 text-center">
          Apenas administradores podem acessar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-4">
        <img src="/LOGO.png" alt="Logo Atacado Léia" className="h-24 mb-4" />
        <h1 className="text-3xl font-bold text-center">Upload de Imagens</h1>
      </div>
      <Navigation />
      <div className="max-w-3xl mx-auto mt-8">
        <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="mb-2">
              Faça upload apenas de imagens no tamanho correto e sem fundo.
              Estas imagens irão para nosso banco de imagens e serão
              automaticamente atualizadas nos encartes.
            </p>
            <p className="text-xs">
              <strong>Nota:</strong> Se estiver tendo problemas com o upload,
              verifique se você está logado como administrador. O upload de
              imagens requer permissões de administrador no Supabase.
            </p>
          </div>
        </div>
        <ImageUploader />
      </div>
    </div>
  );
}
