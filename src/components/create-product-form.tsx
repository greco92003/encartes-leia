"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, X } from "lucide-react";

interface Product {
  nome: string;
  imagem: string;
}

export function CreateProductForm() {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    { nome: "", imagem: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      alert(
        "Por favor, preencha pelo menos o campo de nome para todos os produtos."
      );
      return;
    }

    setIsSubmitting(true);

    try {
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
        alert(`${products.length} produto(s) criado(s) com sucesso!`);
        setProducts([{ nome: "", imagem: "" }]);
        setOpen(false);
      } else {
        throw new Error(result.message || "Falha ao criar produtos");
      }
    } catch (error) {
      console.error("Error creating products:", error);
      alert("Erro ao criar produtos. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 max-w-md">
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar produto na listagem
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novos Produtos</DialogTitle>
          <DialogDescription>
            Adicione novos produtos à listagem. Estes produtos estarão
            disponíveis para seleção nos formulários de encartes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
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

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? "Criando..." : "Criar produtos"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
