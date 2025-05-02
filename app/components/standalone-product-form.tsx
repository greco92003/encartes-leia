"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PlusCircle, X } from "lucide-react";
import { toast } from "sonner";

interface Product {
  nome: string;
  imagem: string;
}

export function StandaloneProductForm() {
  const [products, setProducts] = useState<Product[]>([
    { nome: "", imagem: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>("");

  const addProduct = () => {
    setProducts([...products, { nome: "", imagem: "" }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      const newProducts = [...products];
      newProducts.splice(index, 1);
      setProducts(newProducts);
    }
  };

  const updateProduct = (
    index: number,
    field: keyof Product,
    value: string
  ) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se todos os produtos têm pelo menos um nome
    const isValid = products.every((product) => product.nome.trim());

    if (!isValid) {
      toast.error(
        "Por favor, preencha pelo menos o campo de nome para todos os produtos."
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("Iniciando envio dos produtos...");

    try {
      // Processar os produtos em lotes se houver muitos
      const BATCH_SIZE = 20;
      const totalProducts = products.length;

      if (totalProducts > BATCH_SIZE) {
        // Processar em lotes para grandes quantidades
        let processedCount = 0;
        let successCount = 0;
        const batches = [];

        for (let i = 0; i < totalProducts; i += BATCH_SIZE) {
          const batch = products.slice(i, i + BATCH_SIZE);
          batches.push(batch);
        }

        setSubmitStatus(`Processando ${batches.length} lotes de produtos...`);

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          setSubmitStatus(
            `Enviando lote ${i + 1} de ${batches.length} (${
              batch.length
            } produtos)...`
          );

          // Enviar o lote para a API
          const response = await fetch("/api/create-products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ products: batch }),
          });

          const result = await response.json();

          if (result.success) {
            processedCount += batch.length;
            successCount += batch.length;
            setSubmitStatus(
              `Lote ${
                i + 1
              } concluído. Total: ${processedCount}/${totalProducts} produtos processados.`
            );
          } else {
            processedCount += batch.length;
            setSubmitStatus(`Erro no lote ${i + 1}: ${result.message}`);
            console.error(`Erro no lote ${i + 1}:`, result);
          }

          // Pequena pausa entre os lotes
          if (i < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (successCount === totalProducts) {
          toast.success(
            `${successCount} produto(s) adicionado(s) à listagem com sucesso!`
          );
          setProducts([{ nome: "", imagem: "" }]);
        } else {
          toast.warning(
            `${successCount} de ${totalProducts} produtos foram adicionados à listagem. Verifique o console para mais detalhes.`
          );
        }
      } else {
        // Envio normal para poucos produtos
        setSubmitStatus(`Enviando ${totalProducts} produtos...`);

        // Enviar os produtos para a API
        const response = await fetch("/api/create-products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ products }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success(
            `${products.length} produto(s) adicionado(s) à listagem com sucesso!`
          );
          setProducts([{ nome: "", imagem: "" }]);
        } else {
          throw new Error(
            result.message || "Falha ao adicionar produtos à listagem"
          );
        }
      }
    } catch (error: any) {
      console.error("Error creating products:", error);
      toast.error(
        `Erro ao adicionar produtos à listagem: ${
          error.message || "Erro desconhecido"
        }. Por favor, tente novamente.`
      );
    } finally {
      setIsSubmitting(false);
      setSubmitStatus("");
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Adicionar Novos Produtos à Listagem</CardTitle>
        <CardDescription>
          Adicione novos produtos à listagem (aba "produtos" da planilha). Estes
          produtos estarão disponíveis para seleção nos formulários de encartes,
          mas não serão adicionados automaticamente ao encarte atual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {products.map((product, index) => (
            <div
              key={index}
              className="space-y-4 border p-4 rounded-md relative"
            >
              <div className="absolute top-2 right-2">
                {products.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(index)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`product-name-${index}`}>Nome do produto</Label>
                <Input
                  id={`product-name-${index}`}
                  value={product.nome}
                  onChange={(e) => updateProduct(index, "nome", e.target.value)}
                  placeholder="Adicione o máximo de informações sobre o produto que quer adicionar. Ex: Nome do produto + peso (L, g, ml, etc.)"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`product-image-${index}`}>
                  Link da imagem do produto
                </Label>
                <Input
                  id={`product-image-${index}`}
                  value={product.imagem}
                  onChange={(e) =>
                    updateProduct(index, "imagem", e.target.value)
                  }
                  placeholder="Cole aqui o link direto para a imagem do produto."
                  className="w-full"
                />
              </div>

              {product.imagem && (
                <div className="mt-2 flex justify-center">
                  <div className="relative w-32 h-32 border rounded overflow-hidden">
                    <img
                      src={product.imagem}
                      alt={product.nome || "Prévia da imagem"}
                      className="object-contain w-full h-full"
                      onError={(e) => {
                        // Remover a imagem se houver erro ao carregar
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addProduct}
            className="w-full"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar mais um produto
          </Button>

          {submitStatus && (
            <div className="p-4 border rounded-md bg-blue-50">
              <p className="text-sm text-blue-800">{submitStatus}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? "Adicionando..." : "Adicionar à listagem"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
