# Instruções para Implementação do Campo de Unidade (kg/un)

## 1. Atualizar o Schema do Formulário

No arquivo `src/components/product-form.tsx`, localize o schema do formulário (por volta da linha 38) e adicione o campo `unidade` após o campo `nome`:

```typescript
z.object({
  nome: z.string().optional(),
  unidade: z.enum(["un", "kg"]).default("un"), // Adicionar esta linha
  imagem: z.string().optional(),
  preco: z.coerce.number().optional(),
  // ... resto do código
})
```

## 2. Atualizar os Valores Padrão

No mesmo arquivo, localize a definição dos valores padrão (por volta da linha 110) e adicione o campo `unidade`:

```typescript
.map(() => ({
  nome: "",
  unidade: "un", // Adicionar esta linha
  imagem: "",
  preco: "",
  centavos: "",
  promo: false,
})),
```

## 3. Adicionar o Campo de Unidade no Formulário

Após o componente ProductCombobox (por volta da linha 409), adicione o seguinte código para o campo de unidade:

```tsx
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
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="un" id={`un-${index}`} />
            <label htmlFor={`un-${index}`}>un</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="kg" id={`kg-${index}`} />
            <label htmlFor={`kg-${index}`}>kg</label>
          </div>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## 4. Atualizar a Função onSubmit

Na função onSubmit (por volta da linha 134), adicione o campo `unidade` ao objeto `formattedData`:

```typescript
const formattedData = values.items.map((item, index) => ({
  nome: item.nome || "",
  imagem: item.imagem || productImages[index] || "",
  unidade: item.unidade || "un", // Adicionar esta linha
  preco: item.preco || 0,
  // ... resto do código
}));
```

## 5. Atualizar a API de Submissão

No arquivo `src/app/api/submit/route.ts`, localize a preparação dos dados para a planilha (por volta da linha 32) e adicione o campo `unidade` como último item do array:

```typescript
const values = filledItems.map((item: any) => [
  item.nome,
  item.imagem || "",
  item.preco,
  item.centavos,
  item.promo,
  item.rodape,
  item.de,
  item.ate,
  item.unidade || "un", // Adicionar esta linha
]);
```

Isso adicionará o campo de unidade na coluna I da planilha.
