"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/api-config";

interface PendingProduct {
  productName: string;
  imageUrl: string;
  timestamp: number;
}

export function SyncPendingProducts() {
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Carregar produtos pendentes do localStorage
  useEffect(() => {
    const loadPendingProducts = () => {
      try {
        const pendingProductsJson =
          localStorage.getItem("pendingProducts") || "[]";
        const products: PendingProduct[] = JSON.parse(pendingProductsJson);
        setPendingProducts(products);

        // Carregar a última sincronização
        const lastSync = localStorage.getItem("lastPendingProductsSync");
        if (lastSync) {
          setLastSyncTime(lastSync);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos pendentes:", error);
        toast.error(
          "Erro ao carregar produtos pendentes do armazenamento local."
        );
      }
    };

    loadPendingProducts();

    // Atualizar a cada 30 segundos para caso o usuário adicione novos produtos em outra aba
    const interval = setInterval(loadPendingProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Função para sincronizar produtos pendentes
  const syncPendingProducts = async () => {
    if (pendingProducts.length === 0) {
      toast.info("Não há produtos pendentes para sincronizar.");
      return;
    }

    setIsSyncing(true);
    try {
      console.log(
        `Iniciando sincronização de ${pendingProducts.length} produtos pendentes...`
      );

      // Primeiro, tentar sincronizar com a aba "add" usando a API simplificada
      let addTabSuccess = false;
      try {
        console.log(
          "Tentando sincronizar com a aba 'add' usando API simplificada..."
        );
        const addTabResponse = await fetch(API_ENDPOINTS.SYNC_TO_ADD_TAB, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pendingProducts,
          }),
        });

        if (addTabResponse.ok) {
          const addTabResult = await addTabResponse.json();
          console.log(
            "Resultado da sincronização com a aba 'add':",
            addTabResult
          );

          if (addTabResult.success) {
            addTabSuccess = true;
            toast.success(
              `${addTabResult.addedCount} produtos adicionados à aba "add" com sucesso!`
            );
          }
        } else {
          console.error(
            `Erro na sincronização com a aba 'add': ${addTabResponse.status}`
          );
        }
      } catch (addTabError) {
        console.error("Erro ao sincronizar com a aba 'add':", addTabError);
      }

      // Em seguida, sincronizar com a aba "produtos" usando a API original
      console.log("Sincronizando com a aba 'produtos'...");
      const response = await fetch(API_ENDPOINTS.SYNC_PENDING_PRODUCTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pendingProducts,
        }),
      });

      if (!response.ok) {
        // Se a sincronização com a aba "add" foi bem-sucedida, não lançar erro
        if (addTabSuccess) {
          console.warn(
            `Aviso: Sincronização com a aba "produtos" falhou, mas a aba "add" foi atualizada com sucesso.`
          );

          // Limpar produtos pendentes
          localStorage.removeItem("pendingProducts");
          setPendingProducts([]);

          // Registrar a hora da última sincronização
          const now = new Date().toLocaleString("pt-BR");
          localStorage.setItem("lastPendingProductsSync", now);
          setLastSyncTime(now);

          return;
        }

        throw new Error(
          `Erro na resposta: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Resultado da sincronização com a aba 'produtos':", result);

      if (result.success) {
        // Verificar se temos a nova estrutura de resposta (com abas separadas)
        const isNewResponseFormat =
          typeof result.addedCount === "object" && result.addedCount !== null;

        // Calcular o total de produtos adicionados
        const totalAdded = isNewResponseFormat
          ? (result.addedCount.products || 0) + (result.addedCount.add || 0)
          : result.addedCount;

        // Calcular o total de falhas
        const totalFailed = isNewResponseFormat
          ? (result.failedCount.products || 0) + (result.failedCount.add || 0)
          : result.failedCount;

        // Atualizar a lista de produtos pendentes removendo os que foram adicionados com sucesso
        if (totalAdded > 0) {
          // Se todos foram adicionados com sucesso
          if (totalFailed === 0) {
            localStorage.removeItem("pendingProducts");
            setPendingProducts([]);

            if (isNewResponseFormat) {
              toast.success(
                `Sincronização concluída: ${result.addedCount.products} produtos adicionados à aba "produtos" e ${result.addedCount.add} à aba "add"!`
              );
            } else {
              toast.success(
                `${totalAdded} produtos sincronizados com sucesso!`
              );
            }
          } else {
            // Se alguns falharam, manter apenas os que falharam
            let failedProductNames: string[] = [];

            if (isNewResponseFormat) {
              // Obter nomes de produtos que falharam em ambas as abas
              const productsFailedNames =
                result.failedProducts.products?.map(
                  (p: PendingProduct) => p.productName
                ) || [];

              const addFailedNames =
                result.failedProducts.add?.map(
                  (p: PendingProduct) => p.productName
                ) || [];

              // Combinar os nomes únicos
              failedProductNames = [
                ...new Set([...productsFailedNames, ...addFailedNames]),
              ];
            } else {
              failedProductNames = result.failedProducts.map(
                (p: PendingProduct) => p.productName
              );
            }

            const remainingProducts = pendingProducts.filter((p) =>
              failedProductNames.includes(p.productName)
            );

            localStorage.setItem(
              "pendingProducts",
              JSON.stringify(remainingProducts)
            );
            setPendingProducts(remainingProducts);

            if (isNewResponseFormat) {
              toast.success(
                `Sincronização parcial: ${result.addedCount.products} produtos adicionados à aba "produtos" e ${result.addedCount.add} à aba "add". ${totalFailed} produtos falharam.`
              );
            } else {
              toast.success(
                `${totalAdded} produtos sincronizados com sucesso! ${totalFailed} produtos falharam.`
              );
            }
          }
        } else if (result.skippedCount > 0) {
          // Se todos já existiam na planilha
          localStorage.removeItem("pendingProducts");
          setPendingProducts([]);
          toast.info(
            `Todos os ${result.skippedCount} produtos já existem na planilha.`
          );
        }

        // Registrar a hora da última sincronização
        const now = new Date().toLocaleString("pt-BR");
        localStorage.setItem("lastPendingProductsSync", now);
        setLastSyncTime(now);
      } else {
        toast.error(`Erro na sincronização: ${result.message}`);
      }
    } catch (error) {
      console.error("Erro ao sincronizar produtos pendentes:", error);
      toast.error(
        `Erro ao sincronizar produtos: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Se não houver produtos pendentes, não mostrar o componente
  if (pendingProducts.length === 0 && !lastSyncTime) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Produtos Pendentes de Sincronização
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {pendingProducts.length > 0
              ? `Você tem ${pendingProducts.length} produto(s) salvo(s) localmente que precisam ser sincronizados com a planilha.`
              : "Todos os produtos foram sincronizados com sucesso."}
          </p>
          {lastSyncTime && (
            <p className="text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Última sincronização: {lastSyncTime}
              </span>
            </p>
          )}
        </div>
        {pendingProducts.length > 0 && (
          <Button
            onClick={syncPendingProducts}
            disabled={isSyncing}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
