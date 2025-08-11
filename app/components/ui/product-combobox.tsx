"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn, normalizeText } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ProductComboboxProps {
  products: { nome: string; imagem?: string; id?: string }[];
  value: string;
  onChange: (value: string, imagem?: string) => void;
  onImageChange?: (imagem?: string) => void;
}

export function ProductCombobox({
  products,
  value,
  onChange,
  onImageChange,
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Ordenar produtos em ordem alfabética
  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [products]);

  // Filtrar produtos com base na consulta de pesquisa
  const filteredProducts = React.useMemo(() => {
    if (!searchQuery) return sortedProducts;

    // Normaliza a consulta de pesquisa (remove acentos)
    const normalizedQuery = normalizeText(searchQuery.toLowerCase());

    return sortedProducts.filter((product) => {
      // Normaliza o nome do produto (remove acentos)
      const normalizedProductName = normalizeText(product.nome.toLowerCase());

      // Verifica se o nome normalizado do produto contém a consulta normalizada
      return normalizedProductName.includes(normalizedQuery);
    });
  }, [sortedProducts, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? products.find((product) => product.nome === value)?.nome
            : "Selecione um produto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Buscar produto..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {filteredProducts.map((product, index) => (
              <CommandItem
                key={`${product.id ?? "no-id"}-${product.nome}-${index}`}
                value={product.nome}
                onSelect={(currentValue) => {
                  const newValue = currentValue === value ? "" : currentValue;
                  const selectedProduct = products.find(
                    (p) => p.nome === newValue
                  );

                  // Passa o valor e a imagem para o onChange
                  onChange(newValue, selectedProduct?.imagem);

                  // Se tiver onImageChange, chama a função com a imagem
                  if (onImageChange) {
                    onImageChange(selectedProduct?.imagem);
                  }

                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === product.nome ? "opacity-100" : "opacity-0"
                  )}
                />
                {product.nome}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
