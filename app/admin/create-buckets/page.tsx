"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function CreateBucketsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const createBuckets = async () => {
    setIsCreating(true);
    setResults(null);

    try {
      const response = await fetch("/api/create-logo-buckets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        toast.success("Processo de criação de buckets concluído!");
      } else {
        throw new Error(data.error || "Erro ao criar buckets");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "created":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "already_exists":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo-leia.png"
            alt="Logo Atacado Léia"
            className="h-24 mb-4"
          />
          <h1 className="text-3xl font-bold text-center mb-2">
            Criar Buckets de Logos
          </h1>
          <p className="text-gray-600 text-center">
            Crie os buckets necessários para armazenar logos do atacado e das ofertas
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buckets que serão criados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">logos-atacado</h3>
                <p className="text-gray-600">
                  Para armazenar logos principais do atacado (ex: logo da empresa)
                </p>
                <div className="mt-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Público
                  </span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
                    Limite: 5MB
                  </span>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">logos-ofertas</h3>
                <p className="text-gray-600">
                  Para armazenar logos das ofertas (ex: HORTI FRUTI, ESPECIAL DAS CARNES)
                </p>
                <div className="mt-2">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Público
                  </span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
                    Limite: 5MB
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <Button
            onClick={createBuckets}
            disabled={isCreating}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Criando buckets...
              </>
            ) : (
              "Criar Buckets"
            )}
          </Button>
        </div>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Criação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Resumo */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Resumo</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold ml-1">
                        {results.summary?.total_buckets || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600">Criados:</span>
                      <span className="font-semibold ml-1">
                        {results.summary?.created || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-yellow-600">Já existiam:</span>
                      <span className="font-semibold ml-1">
                        {results.summary?.already_existed || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600">Erros:</span>
                      <span className="font-semibold ml-1">
                        {results.summary?.errors || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalhes dos buckets */}
                <div>
                  <h3 className="font-semibold mb-2">Detalhes dos Buckets</h3>
                  <div className="space-y-2">
                    {results.buckets?.map((bucket: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(bucket.status)}
                          <div>
                            <span className="font-medium">{bucket.bucket}</span>
                            <p className="text-sm text-gray-600">{bucket.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instruções para políticas */}
                {results.policies && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      Próximos Passos - Políticas RLS
                    </h3>
                    <div className="text-sm text-yellow-700">
                      {results.policies[0]?.instructions?.map((instruction: string, index: number) => (
                        <p key={index} className="mb-1">{instruction}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
