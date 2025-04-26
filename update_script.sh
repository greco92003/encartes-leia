#!/bin/bash

# 1. Atualizar o schema do formulário para incluir o campo de unidade
sed -i 's/nome: z.string().optional(),/nome: z.string().optional(),\n        unidade: z.enum(["un", "kg"]).default("un"),/' src/components/product-form.tsx

# 2. Atualizar os valores padrão para incluir o campo de unidade
sed -i 's/nome: "",/nome: "",\n        unidade: "un",/' src/components/product-form.tsx

# 3. Adicionar o campo de unidade após o campo de nome do produto
sed -i '/<\/FormItem>\n                        )}\n                      \/>/ {
    r unidade_field.txt
    }' src/components/product-form.tsx

# 4. Atualizar a função onSubmit para incluir o campo de unidade
sed -i 's/imagem: item.imagem || productImages\[index\] || "", \/\/ Incluir a imagem do produto/imagem: item.imagem || productImages[index] || "", \/\/ Incluir a imagem do produto\n        unidade: item.unidade || "un", \/\/ Incluir a unidade do produto/' src/components/product-form.tsx

# 5. Atualizar a API de submissão para incluir o campo de unidade
sed -i 's/item.ate,/item.ate,\n      item.unidade || "un", \/\/ Adicionar a unidade na coluna I/' src/app/api/submit/route.ts

echo "Alterações concluídas!"
