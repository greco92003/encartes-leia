"use client";

import React, { useState, useEffect } from "react";
import { CreateProductForm } from "@/components/create-product-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { ProductCombobox } from "@/components/ui/product-combobox";
import { Product, fetchProductsFromGoogleSheet } from "@/lib/excel-utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

const formSchema = z.object({
  globalDateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }),
  items: z
    .array(
      z.object({
        nome: z.string().optional(),
        imagem: z.string().optional(), // Adicionando campo de imagem ao schema
        unidade: z.enum(["un", "kg"]).default("un"),
        preco: z.coerce.number().optional(),
        centavos: z.coerce
          .number()
          .min(0, "Centavos deve ser entre 0 e 99")
          .max(99, "Centavos deve ser entre 0 e 99")
          .optional(),
        promo: z.boolean().default(false),
        rodapeTipo: z.enum(["comprando", "limite"]).optional(),
        rodapeQuantidade: z.coerce.number().optional(),
      })
    )
    // Removemos a restrição de tamanho fixo
    .min(1, "Adicione pelo menos um produto"),
});

interface ProductFormProps {
  formType?: "regular" | "meat" | "hortiFruti";
  storageKey?: string;
  initialProductCount?: number;
}

export function ProductForm({
  formType = "regular",
  storageKey = "encarteFormData",
  initialProductCount = 60,
}: ProductFormProps = {}) {
  // Usar um storageKey específico para cada tipo de formulário
  const formTypeStorageKey = `${storageKey}_${formType}`;

  console.log("ProductForm: Componente renderizado", {
    formType,
    storageKey: formTypeStorageKey,
    initialProductCount,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [productImages, setProductImages] = useState<Record<number, string>>(
    {}
  );
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  // Estado para controlar o número de produtos no formulário
  const [productCount, setProductCount] = useState<number>(initialProductCount);
  // Estados para o diálogo de confirmação
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formattedDataToSubmit, setFormattedDataToSubmit] = useState<any[]>([]);

  // Estado para armazenar os valores de quantidade para cada tipo de promoção
  const [promoQuantities, setPromoQuantities] = useState<
    Record<number, { comprando?: number; limite?: number }>
  >({});

  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log(
          "ProductForm: Iniciando carregamento de produtos da planilha do Google..."
        );

        // Tentar buscar produtos da API primeiro (mais confiável)
        try {
          console.log("ProductForm: Tentando buscar produtos da API...");
          const response = await fetch("/api/google-products");

          if (!response.ok) {
            throw new Error(
              `Erro ao buscar produtos da API: ${response.status}`
            );
          }

          const data = await response.json();
          console.log(`ProductForm: Produtos carregados da API: ${data.count}`);

          if (data.products && data.products.length > 0) {
            setProducts(data.products);
            console.log(
              `ProductForm: ${data.products.length} produtos definidos no estado`
            );
            return; // Sair da função se os produtos foram carregados com sucesso
          } else {
            console.warn(
              "ProductForm: API retornou array vazio, tentando método alternativo"
            );
          }
        } catch (apiError) {
          console.error(
            "ProductForm: Erro ao buscar produtos da API:",
            apiError
          );
          console.log("ProductForm: Tentando método alternativo...");
        }

        // Método alternativo: buscar diretamente da planilha
        console.log(
          "ProductForm: Buscando produtos diretamente da planilha do Google..."
        );
        const googleProducts = await fetchProductsFromGoogleSheet();

        if (googleProducts && googleProducts.length > 0) {
          setProducts(googleProducts);
          console.log(
            `ProductForm: Produtos carregados com sucesso diretamente da planilha: ${googleProducts.length} produtos`
          );
        } else {
          console.warn(
            "ProductForm: Nenhum produto encontrado na planilha do Google, usando produtos de exemplo"
          );
          // Fallback para produtos de exemplo
          setProducts([
            { id: "1", nome: "Produto 1", imagem: "" },
            { id: "2", nome: "Produto 2", imagem: "" },
            { id: "3", nome: "Produto 3", imagem: "" },
          ]);
        }
      } catch (error) {
        console.error("ProductForm: Erro ao carregar produtos:", error);
        // Fallback para produtos de exemplo em caso de erro
        setProducts([
          { id: "1", nome: "Produto 1", imagem: "" },
          { id: "2", nome: "Produto 2", imagem: "" },
          { id: "3", nome: "Produto 3", imagem: "" },
        ]);
      }
    };

    loadProducts();
  }, []);

  // Função para criar valores padrão com base no número de produtos
  const createEmptyDefaultValues = (count: number) => ({
    globalDateRange: {
      from: new Date(),
      to: new Date(),
    },
    items: Array(count)
      .fill(0)
      .map(() => ({
        nome: "",
        imagem: "", // Adicionando campo de imagem vazio
        unidade: "un" as const, // Valor padrão para unidade
        preco: undefined,
        centavos: undefined,
        promo: false,
      })),
  });

  // Valores padrão para o formulário
  const emptyDefaultValues = createEmptyDefaultValues(productCount);

  // Inicialmente usamos os valores padrão vazios
  const defaultValues = emptyDefaultValues;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Carregar dados do localStorage apenas no lado do cliente
  React.useEffect(() => {
    // Função para carregar dados salvos
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem(formTypeStorageKey);
        if (!savedData) return null;

        const parsedData = JSON.parse(savedData);

        // Converter strings de data de volta para objetos Date
        if (parsedData.globalDateRange) {
          if (parsedData.globalDateRange.from) {
            parsedData.globalDateRange.from = new Date(
              parsedData.globalDateRange.from
            );
          }
          if (parsedData.globalDateRange.to) {
            parsedData.globalDateRange.to = new Date(
              parsedData.globalDateRange.to
            );
          }
        }

        return parsedData;
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
        return null;
      }
    };

    // Carregar dados salvos e atualizar o formulário
    const savedData = loadSavedData();
    if (savedData) {
      // Atualizar o contador de produtos se houver mais produtos salvos
      if (savedData.items && savedData.items.length > productCount) {
        setProductCount(savedData.items.length);
      }

      form.reset(savedData);

      // Restaurar as imagens dos produtos
      if (savedData.items) {
        const newImages: Record<number, string> = {};
        savedData.items.forEach((item: any, index: number) => {
          if (item.imagem) {
            newImages[index] = item.imagem;
          }
        });
        setProductImages(newImages);
      }
    }
  }, [form]);

  // Não precisamos mais de um localStorage separado para as imagens
  // pois elas agora são armazenadas diretamente no formulário

  // Salvar dados no localStorage quando o formulário for alterado
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value) {
        // Criar uma cópia para evitar problemas de circularidade no JSON
        const formData = JSON.stringify(value, (_key, val) => {
          // Converter objetos Date para string ISO
          if (val instanceof Date) {
            return val.toISOString();
          }
          return val;
        });
        localStorage.setItem(formTypeStorageKey, formData);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, formTypeStorageKey]);

  // Função para limpar todos os produtos
  const clearAllProducts = () => {
    if (window.confirm("Tem certeza que deseja apagar todos os produtos?")) {
      // Resetar o formulário para os valores vazios
      form.reset(createEmptyDefaultValues(productCount));

      // Limpar as imagens dos produtos
      setProductImages({});

      // Limpar os dados salvos no localStorage
      localStorage.removeItem(formTypeStorageKey);

      alert("Todos os produtos foram apagados!");
    }
  };

  // Função para adicionar mais produtos ao formulário
  const addMoreProducts = () => {
    // Obter os valores atuais do formulário
    const currentValues = form.getValues();
    const currentItems = currentValues.items || [];

    // Adicionar 5 novos produtos vazios
    const newCount = productCount + 5;
    const newItems = [
      ...currentItems,
      ...Array(5)
        .fill(0)
        .map(() => ({
          nome: "",
          imagem: "", // Adicionando campo de imagem vazio
          unidade: "un" as const, // Valor padrão para unidade
          preco: undefined,
          centavos: undefined,
          promo: false,
        })),
    ];

    // Atualizar o estado e o formulário
    setProductCount(newCount);
    form.setValue("items", newItems);

    // Salvar no localStorage
    const formData = JSON.stringify(
      { ...currentValues, items: newItems },
      (_key, val) => {
        if (val instanceof Date) {
          return val.toISOString();
        }
        return val;
      }
    );
    localStorage.setItem(formTypeStorageKey, formData);

    // Rolar para o primeiro novo produto adicionado
    setTimeout(() => {
      const newProductElement = document.getElementById(
        `product-${productCount}`
      );
      if (newProductElement) {
        newProductElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Função para restaurar o número inicial de produtos
  const restoreInitialProductCount = () => {
    // Obter os valores atuais do formulário
    const currentValues = form.getValues();
    const currentItems = currentValues.items || [];

    // Se o número atual de produtos já é menor ou igual ao inicial, não faz nada
    if (productCount <= initialProductCount) {
      alert("O número de produtos já está no valor inicial ou menor.");
      return;
    }

    // Confirmar a ação com o usuário
    if (
      !window.confirm(
        `Tem certeza que deseja restaurar para ${initialProductCount} produtos? Os dados preenchidos nas linhas que permanecerem serão mantidos.`
      )
    ) {
      return;
    }

    // Manter apenas o número inicial de produtos, preservando os dados
    const newItems = currentItems.slice(0, initialProductCount);

    // Atualizar o estado e o formulário
    setProductCount(initialProductCount);
    form.setValue("items", newItems);

    // Salvar no localStorage
    const formData = JSON.stringify(
      { ...currentValues, items: newItems },
      (_key, val) => {
        if (val instanceof Date) {
          return val.toISOString();
        }
        return val;
      }
    );
    localStorage.setItem(formTypeStorageKey, formData);

    alert(`Número de produtos restaurado para ${initialProductCount}.`);
  };

  // Função para preparar os dados para envio
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Format data for Google Sheets
    const formattedData = values.items.map((item, index) => {
      // Criar um objeto com os campos do formulário
      const formattedItem = {
        nome: item.nome || "",
        unidade: item.unidade || "un", // Incluir a unidade do produto
        preco: item.preco || 0,
        centavos: item.centavos || 0,
        promo: item.promo ? "show" : "hide",
        rodape:
          item.promo && item.rodapeTipo
            ? item.rodapeTipo === "comprando"
              ? `Comprando ${item.rodapeQuantidade}un do item`
              : `Limite ${item.rodapeQuantidade}un por cliente`
            : "",
        de: values.globalDateRange.from
          ? values.globalDateRange.from.toISOString().split("T")[0]
          : "",
        ate: values.globalDateRange.to
          ? values.globalDateRange.to.toISOString().split("T")[0]
          : "",
      };

      // Adicionar a imagem do produto (que não está no tipo original)
      return {
        ...formattedItem,
        imagem: productImages[index] || "", // Incluir a imagem do produto
      };
    });

    // Filtrar apenas os itens que têm nome preenchido
    const filledItems = formattedData.filter((item) => item.nome);

    // Armazenar os dados formatados para uso posterior
    setFormattedDataToSubmit(filledItems);

    // Mostrar o diálogo de confirmação
    setShowConfirmation(true);
  }

  // Função para enviar os dados para a API após confirmação
  async function submitToAPI(): Promise<void> {
    setIsSubmitting(true);
    try {
      console.log(
        "Enviando dados para a API:",
        JSON.stringify(formattedDataToSubmit)
      );

      // Send the data to our API endpoint (usando a versão mais recente da API)
      const response = await fetch("/api/submit-v3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: formattedDataToSubmit }),
      });

      const result = await response.json();
      console.log("Resposta da API:", result);

      if (result.success) {
        // Armazenar os dados enviados
        setSubmittedData(formattedDataToSubmit);

        // Armazenar a URL da planilha
        if (result.sheetUrl) {
          setSheetUrl(result.sheetUrl);
        }

        // Fechar o diálogo de confirmação e mostrar os resultados
        setShowConfirmation(false);
        setShowResults(true);

        // Mostrar notificação de sucesso usando toast
        toast.success("Dados enviados com sucesso para a planilha!");
      } else {
        console.error("Erro retornado pela API:", result);
        throw new Error(result.message || "Falha ao enviar dados");
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);

      // Mostrar notificação de erro usando toast
      toast.error(
        `Erro ao enviar dados: ${error.message || "Erro desconhecido"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Diálogo de confirmação */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={submitToAPI}
        title="Confirmar Envio de Dados"
        description="Revise os dados antes de enviar para a planilha."
        data={formattedDataToSubmit}
        isSubmitting={isSubmitting}
      />

      {showResults && submittedData && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Dados Enviados</h2>
            <div className="flex gap-2">
              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Abrir Planilha
                </a>
              )}
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Voltar ao Formulário
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-2 text-left">Nome</th>
                  <th className="border p-2 text-left">Imagem</th>
                  <th className="border p-2 text-left">Unidade</th>
                  <th className="border p-2 text-left">Preço</th>
                  <th className="border p-2 text-left">Centavos</th>
                  <th className="border p-2 text-left">Promoção</th>
                  <th className="border p-2 text-left">Rodapé</th>
                  <th className="border p-2 text-left">De</th>
                  <th className="border p-2 text-left">Até</th>
                </tr>
              </thead>
              <tbody>
                {submittedData.map((item, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="border p-2">{item.nome}</td>
                    <td className="border p-2">
                      {item.imagem ? (
                        <div className="flex items-center">
                          <div className="w-10 h-10 mr-2 relative">
                            <img
                              src={item.imagem}
                              alt={item.nome}
                              className="object-contain w-full h-full"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <span className="text-xs text-blue-500 truncate max-w-[150px]">
                            {item.imagem}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border p-2 font-bold">
                      {item.unidade || "un"}
                    </td>
                    <td className="border p-2">{item.preco}</td>
                    <td className="border p-2">{item.centavos}</td>
                    <td className="border p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.promo === "show"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.promo}
                      </span>
                    </td>
                    <td className="border p-2">{item.rodape || "-"}</td>
                    <td className="border p-2">{item.de}</td>
                    <td className="border p-2">{item.ate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!showResults && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="globalDateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Validade das Ofertas
                      </FormLabel>
                      <FormControl>
                        <DatePickerWithRange
                          value={field.value as DateRange}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Produtos do Encarte</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Preencha os dados dos produtos que deseja incluir no encarte.
                Você pode adicionar mais produtos clicando no botão no final da
                lista.
              </p>
            </div>
            <div className="grid gap-6">
              {form.watch("items").map((_, index) => (
                <Card
                  key={index}
                  className="overflow-hidden"
                  id={`product-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        Produto #{index + 1}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      {/* Imagem do produto */}
                      {productImages[index] && (
                        <div className="flex justify-center mr-2">
                          <div className="relative w-16 h-16 border rounded overflow-hidden">
                            <img
                              src={productImages[index]}
                              alt={
                                form.watch(`items.${index}.nome`) || "Produto"
                              }
                              className="object-contain w-full h-full"
                              onError={(e) => {
                                // Remover a imagem se houver erro ao carregar
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-[200px]">
                        <FormField
                          control={form.control}
                          name={`items.${index}.nome`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do produto</FormLabel>
                              <FormControl>
                                <ProductCombobox
                                  products={products}
                                  value={field.value}
                                  onChange={(value, imagem) => {
                                    field.onChange(value);
                                    // Armazenar a imagem do produto selecionado
                                    if (imagem) {
                                      // Atualizar o estado local para exibição imediata
                                      setProductImages((prev) => ({
                                        ...prev,
                                        [index]: imagem,
                                      }));
                                      // Agora podemos usar setValue para o campo imagem pois ele existe no schema
                                      form.setValue(
                                        `items.${index}.imagem`,
                                        imagem
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-20">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unidade`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unidade</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem
                                      value="un"
                                      id={`un-${index}`}
                                    />
                                    <Label htmlFor={`un-${index}`}>un</Label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem
                                      value="kg"
                                      id={`kg-${index}`}
                                    />
                                    <Label htmlFor={`kg-${index}`}>kg</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-20">
                        <FormField
                          control={form.control}
                          name={`items.${index}.preco`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  className="w-16"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "" || /^\d+$/.test(value)) {
                                      field.onChange(
                                        value === "" ? "" : Number(value)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-20">
                        <FormField
                          control={form.control}
                          name={`items.${index}.centavos`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Centavos</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={2}
                                  className="w-12"
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      (/^\d+$/.test(value) &&
                                        Number(value) <= 99)
                                    ) {
                                      field.onChange(
                                        value === "" ? "" : Number(value)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="w-24">
                        <FormField
                          control={form.control}
                          name={`items.${index}.promo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Promoção?</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    // Se ativar a promoção, definir o tipo como "comprando" por padrão
                                    if (checked) {
                                      form.setValue(
                                        `items.${index}.rodapeTipo`,
                                        "comprando"
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch(`items.${index}.promo`) && (
                        <div className="w-auto">
                          <FormField
                            control={form.control}
                            name={`items.${index}.rodapeTipo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de promoção</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={(value) => {
                                      // Salvar o valor atual antes de mudar
                                      const currentType =
                                        field.value || "comprando";
                                      const currentQuantity = form.watch(
                                        `items.${index}.rodapeQuantidade`
                                      );

                                      // Atualizar o estado de quantidades
                                      setPromoQuantities((prev) => {
                                        const newState = { ...prev };
                                        if (!newState[index])
                                          newState[index] = {};

                                        // Salvar o valor atual
                                        if (currentQuantity) {
                                          newState[index][currentType] =
                                            currentQuantity;
                                        }

                                        return newState;
                                      });

                                      // Atualizar o tipo de promoção
                                      field.onChange(value);

                                      // Restaurar o valor salvo para o novo tipo, se existir
                                      setTimeout(() => {
                                        const savedValue =
                                          promoQuantities[index]?.[
                                            value as "comprando" | "limite"
                                          ];
                                        form.setValue(
                                          `items.${index}.rodapeQuantidade`,
                                          savedValue || undefined
                                        );
                                      }, 0);
                                    }}
                                    value={field.value || "comprando"}
                                    className="flex flex-col space-y-1"
                                  >
                                    <div className="flex items-center space-x-1">
                                      <RadioGroupItem
                                        value="comprando"
                                        id={`comprando-${index}`}
                                      />
                                      <label
                                        htmlFor={`comprando-${index}`}
                                        className="flex items-center text-xs"
                                      >
                                        Comprando
                                      </label>
                                    </div>

                                    {field.value === "comprando" && (
                                      <div className="ml-6 flex items-center">
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-10 mx-1 h-6"
                                          value={
                                            form.watch(
                                              `items.${index}.rodapeQuantidade`
                                            ) || ""
                                          }
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (
                                              value === "" ||
                                              /^\d+$/.test(value)
                                            ) {
                                              form.setValue(
                                                `items.${index}.rodapeQuantidade`,
                                                value === ""
                                                  ? undefined
                                                  : parseInt(value)
                                              );
                                            }
                                          }}
                                        />
                                        <span className="text-xs">
                                          un. do item
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center space-x-1">
                                      <RadioGroupItem
                                        value="limite"
                                        id={`limite-${index}`}
                                      />
                                      <label
                                        htmlFor={`limite-${index}`}
                                        className="flex items-center text-xs"
                                      >
                                        Limite de
                                      </label>
                                    </div>

                                    {field.value === "limite" && (
                                      <div className="ml-6 flex items-center">
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-10 mx-1 h-6"
                                          value={
                                            form.watch(
                                              `items.${index}.rodapeQuantidade`
                                            ) || ""
                                          }
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            if (
                                              value === "" ||
                                              /^\d+$/.test(value)
                                            ) {
                                              form.setValue(
                                                `items.${index}.rodapeQuantidade`,
                                                value === ""
                                                  ? undefined
                                                  : parseInt(value)
                                              );
                                            }
                                          }}
                                        />
                                        <span className="text-xs">
                                          un. por cliente
                                        </span>
                                      </div>
                                    )}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Botões para gerenciar produtos */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMoreProducts}
                  className="flex-1 max-w-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Adicionar mais produtos
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={restoreInitialProductCount}
                  className="flex-1 max-w-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  Restaurar número de produtos inicial
                </Button>

                <CreateProductForm />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                {isSubmitting ? "Enviando..." : "Enviar dados para a planilha"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={clearAllProducts}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                Apagar todos os produtos
              </Button>
            </div>
          </form>
        </Form>
      )}
    </>
  );
}
