"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { DateRange } from "react-day-picker";

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
import {
  FormData,
  Product,
  fetchProductsFromGoogleSheet,
} from "@/lib/excel-utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  globalDateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }),
  items: z
    .array(
      z.object({
        nome: z.string().optional(),
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
    .length(60),
});

export function ProductForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [productImages, setProductImages] = useState<Record<number, string>>(
    {}
  );
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Buscar produtos diretamente da planilha do Google
        const googleProducts = await fetchProductsFromGoogleSheet();
        if (googleProducts.length > 0) {
          setProducts(googleProducts);
          console.log(
            "Produtos carregados da planilha do Google:",
            googleProducts
          );
        } else {
          // Fallback para a API local
          const response = await fetch("/api/products");
          const data = await response.json();
          if (data.products) {
            setProducts(data.products);
          }
        }
      } catch (error) {
        console.error("Error loading products:", error);
        // Fallback para a API local em caso de erro
        try {
          const response = await fetch("/api/products");
          const data = await response.json();
          if (data.products) {
            setProducts(data.products);
          }
        } catch (e) {
          console.error("Error loading products from API:", e);
        }
      }
    };

    loadProducts();
  }, []);

  // Valores padrão para o formulário
  const emptyDefaultValues = {
    globalDateRange: {
      from: new Date(),
      to: new Date(),
    },
    items: Array(60)
      .fill(0)
      .map(() => ({
        nome: "",
        preco: "",
        centavos: "",
        promo: false,
      })),
  };

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
        const savedData = localStorage.getItem("encarteFormData");
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

  // Salvar dados no localStorage quando o formulário for alterado
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value) {
        // Criar uma cópia para evitar problemas de circularidade no JSON
        const formData = JSON.stringify(value, (key, val) => {
          // Converter objetos Date para string ISO
          if (val instanceof Date) {
            return val.toISOString();
          }
          return val;
        });
        localStorage.setItem("encarteFormData", formData);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Função para limpar todos os produtos
  const clearAllProducts = () => {
    if (window.confirm("Tem certeza que deseja apagar todos os produtos?")) {
      // Resetar o formulário para os valores vazios
      form.reset(emptyDefaultValues);

      // Limpar as imagens dos produtos
      setProductImages({});

      // Limpar os dados salvos no localStorage
      localStorage.removeItem("encarteFormData");

      alert("Todos os produtos foram apagados!");
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Format data for Google Sheets
      const formattedData = values.items.map((item, index) => ({
        nome: item.nome || "",
        imagem: item.imagem || productImages[index] || "", // Incluir a imagem do produto
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
      }));

      // Send the data to our API endpoint
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: formattedData }),
      });

      const result = await response.json();

      if (result.success) {
        // Filtrar apenas os itens que têm nome preenchido
        const filledItems = formattedData.filter((item) => item.nome);
        setSubmittedData(filledItems);

        // Armazenar a URL da planilha
        if (result.sheetUrl) {
          setSheetUrl(result.sheetUrl);
        }

        setShowResults(true);
      } else {
        throw new Error(result.message || "Falha ao enviar dados");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Erro ao enviar dados. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
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
                Não é necessário preencher todos os 60 campos.
              </p>
            </div>
            <div className="grid gap-6">
              {form.watch("items").map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">
                        Produto #{index + 1}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Imagem do produto */}
                      {productImages[index] && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-center mb-4">
                          <div className="relative w-40 h-40 border rounded overflow-hidden">
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
                                    setProductImages((prev) => ({
                                      ...prev,
                                      [index]: imagem,
                                    }));
                                    // Atualizar o campo de imagem no formulário
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

                      <div className="flex space-x-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.preco`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Preço</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
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

                        <FormField
                          control={form.control}
                          name={`items.${index}.centavos`}
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormLabel>Centavos</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={2}
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

                      <FormField
                        control={form.control}
                        name={`items.${index}.promo`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between space-x-2">
                            <FormLabel>Tem promoção de preços?</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch(`items.${index}.promo`) && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.rodapeTipo`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de promoção</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="comprando"
                                        id={`comprando-${index}`}
                                      />
                                      <label
                                        htmlFor={`comprando-${index}`}
                                        className="flex items-center"
                                      >
                                        Comprando
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-16 mx-2"
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
                                                  ? ""
                                                  : parseInt(value)
                                              );
                                            }
                                          }}
                                        />
                                        un. do item
                                      </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="limite"
                                        id={`limite-${index}`}
                                      />
                                      <label
                                        htmlFor={`limite-${index}`}
                                        className="flex items-center"
                                      >
                                        Limite de
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          className="w-16 mx-2"
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
                                                  ? ""
                                                  : parseInt(value)
                                              );
                                            }
                                          }}
                                        />
                                        un. por cliente
                                      </label>
                                    </div>
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
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Enviando..." : "Enviar dados para a planilha"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={clearAllProducts}
                className="flex-1"
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
