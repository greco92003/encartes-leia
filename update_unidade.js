const fs = require('fs');
const path = require('path');

// 1. Atualizar o schema do formulário
const productFormPath = path.join(__dirname, 'src', 'components', 'product-form.tsx');
let productFormContent = fs.readFileSync(productFormPath, 'utf8');

// Adicionar o campo unidade ao schema
productFormContent = productFormContent.replace(
  /nome: z\.string\(\)\.optional\(\),/,
  'nome: z.string().optional(),\n        unidade: z.enum(["un", "kg"]).default("un"),'
);

// 2. Atualizar os valores padrão
productFormContent = productFormContent.replace(
  /nome: "",/,
  'nome: "",\n        unidade: "un",'
);

// 3. Importar o componente RadioGroup
if (!productFormContent.includes('RadioGroup')) {
  productFormContent = productFormContent.replace(
    /import {([^}]*)}/,
    'import {\n  RadioGroup,\n  RadioGroupItem,$1}'
  );
}

// 4. Adicionar o campo de unidade no formulário
productFormContent = productFormContent.replace(
  /<\/FormItem>\n                          \)\n                        \}\n                      \/>/,
  `</FormItem>
                          )
                        }
                      />
                      
                      <FormField
                        control={form.control}
                        name={\`items.\${index}.unidade\`}
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
                                  <RadioGroupItem value="un" id={\`un-\${index}\`} />
                                  <label htmlFor={\`un-\${index}\`}>un</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="kg" id={\`kg-\${index}\`} />
                                  <label htmlFor={\`kg-\${index}\`}>kg</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />`
);

// 5. Atualizar a função onSubmit
productFormContent = productFormContent.replace(
  /imagem: item\.imagem \|\| productImages\[index\] \|\| "", \/\/ Incluir a imagem do produto/,
  'imagem: item.imagem || productImages[index] || "", // Incluir a imagem do produto\n        unidade: item.unidade || "un", // Incluir a unidade do produto'
);

fs.writeFileSync(productFormPath, productFormContent);

// 6. Atualizar a API de submissão
const submitApiPath = path.join(__dirname, 'src', 'app', 'api', 'submit', 'route.ts');
let submitApiContent = fs.readFileSync(submitApiPath, 'utf8');

// Adicionar o campo unidade à API
submitApiContent = submitApiContent.replace(
  /item\.de,\n      item\.ate,/,
  'item.de,\n      item.ate,\n      item.unidade || "un", // Adicionar a unidade na coluna I'
);

fs.writeFileSync(submitApiPath, submitApiContent);

console.log('Alterações concluídas com sucesso!');
