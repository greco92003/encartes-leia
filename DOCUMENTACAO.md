# Documentação do Projeto Gerador de Encartes

## Visão Geral

O Gerador de Encartes é uma aplicação web desenvolvida para o Atacado Léia, que permite criar e gerenciar encartes promocionais. A aplicação permite adicionar produtos, definir preços, promoções e gerar encartes para diferentes seções da loja (Ofertas de Fim de Semana, Especial das Carnes, Horti-Fruti).

## Tecnologias Utilizadas

- **Frontend**: Next.js, React, TypeScript
- **UI**: Shadcn UI, Tailwind CSS
- **Armazenamento de Dados**: Google Sheets API
- **Armazenamento de Imagens**: Supabase Storage
- **Hospedagem**: Vercel

## Estrutura do Projeto

```
formulario-encarte-atacado/
├── public/                  # Arquivos estáticos
│   ├── favicon-leia.png     # Favicon da aplicação
│   ├── logo-leia.png        # Logo do Atacado Léia
│   └── produtos.xlsx        # Arquivo local de produtos (fallback)
├── src/
│   ├── app/                 # Rotas da aplicação
│   │   ├── api/             # Endpoints da API
│   │   ├── especial-das-carnes/  # Página de ofertas de carnes
│   │   ├── horti-fruti/     # Página de ofertas de hortifruti
│   │   ├── upload-de-imagens/ # Página de upload de imagens
│   │   ├── alterar-nome-produto/ # Página para editar nomes de produtos
│   │   └── page.tsx         # Página principal (Ofertas de Fim de Semana)
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/              # Componentes de UI
│   │   └── product-form.tsx # Formulário de produtos
│   ├── lib/                 # Utilitários e funções auxiliares
│   │   ├── excel-utils.ts   # Funções para manipulação de dados
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── utils.ts         # Funções utilitárias gerais
│   └── styles/              # Estilos globais
└── .env.local               # Variáveis de ambiente (não versionado)
```

## Fontes de Dados

### Google Sheets

A aplicação utiliza o Google Sheets como banco de dados principal:

1. **Planilha de Produtos**: Contém a lista de produtos disponíveis
   - ID da planilha: `1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w`
   - Aba: `produtos`
   - Estrutura:
     - Coluna A: Nome do produto
     - Coluna B: URL da imagem (opcional)
     - Coluna C: ID único do produto

2. **Planilha de Saída**: Armazena os dados dos encartes gerados
   - ID da planilha: `1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8`
   - Aba: `Página1`
   - Estrutura:
     - Coluna A: Nome do produto
     - Coluna B: Imagem (deixada em branco pela aplicação)
     - Coluna C: Preço
     - Coluna D: Centavos
     - Coluna E: Promoção (show/hide)
     - Coluna F: Rodapé
     - Coluna G: Data inicial
     - Coluna H: Data final

### Supabase

Utilizado para armazenamento de imagens:
- Bucket: `imagens-leia`
- Projeto: `imagens-leia`

## Funcionalidades Principais

### 1. Gerenciamento de Produtos

- **Busca de Produtos**: Pesquisa produtos pelo nome
- **Edição de Nomes**: Permite alterar nomes de produtos na planilha
- **Adição de Produtos**: Permite adicionar novos produtos à planilha

### 2. Criação de Encartes

- **Ofertas de Fim de Semana**: Formulário com 60 produtos iniciais
- **Especial das Carnes**: Formulário com 12 produtos iniciais
- **Ofertas Horti-Fruti**: Formulário com 12 produtos iniciais

### 3. Configuração de Promoções

- **Tipos de Promoção**:
  - Comprando X unidades do item
  - Limite de X unidades por cliente
- **Período de Validade**: Seleção de datas de início e fim da promoção

### 4. Upload de Imagens

- Interface para upload de imagens para o Supabase Storage
- Integração com o formulário de produtos

## Fluxos de Trabalho

### Criação de Encarte

1. Selecionar o tipo de encarte (Fim de Semana, Carnes, Horti-Fruti)
2. Preencher os produtos com:
   - Nome do produto (busca na lista)
   - Preço e centavos
   - Configuração de promoção (opcional)
   - Período de validade (opcional)
3. Enviar o formulário para atualizar a planilha de saída

### Alteração de Nome de Produto

1. Acessar a página "Alterar nome produto"
2. Selecionar o produto original na lista
3. Digitar o novo nome
4. Confirmar a alteração

### Upload de Imagens

1. Acessar a página "Upload de Imagens"
2. Selecionar ou arrastar arquivos de imagem
3. Aguardar o upload para o Supabase
4. Copiar o link da imagem gerado

## Configuração do Ambiente

### Variáveis de Ambiente Necessárias

```
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=email-da-conta-de-servico@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="chave-privada-da-conta-de-servico"
SPREADSHEET_ID=id-da-planilha-de-saida
TEST_MODE=false
NEXT_PUBLIC_GOOGLE_API_KEY=chave-publica-da-api-do-google

# Supabase
NEXT_PUBLIC_SUPABASE_URL=url-do-projeto-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=chave-anonima-do-supabase
```

### Permissões Necessárias

1. **Google Sheets API**:
   - A conta de serviço precisa ter permissão de escrita nas planilhas
   - A API key pública precisa ter acesso à API do Google Sheets

2. **Supabase**:
   - Bucket configurado com políticas de acesso adequadas
   - Chave anônima com permissões para upload de arquivos

## Manutenção e Troubleshooting

### Problemas Comuns

1. **Erro ao carregar produtos**:
   - Verificar se a API key do Google está ativa
   - Verificar se a planilha de produtos existe e está acessível

2. **Erro ao atualizar nomes**:
   - Verificar as credenciais da conta de serviço
   - Verificar permissões de escrita na planilha

3. **Erro no upload de imagens**:
   - Verificar configurações do bucket no Supabase
   - Verificar chave anônima do Supabase

### Atualizações Futuras Planejadas

1. Implementação de autenticação de usuários
2. Histórico de encartes gerados
3. Visualização prévia do encarte antes de enviar
4. Exportação para formatos adicionais (PDF, imagem)

## Segurança

- Todas as credenciais sensíveis devem ser armazenadas em variáveis de ambiente
- Nunca commit credenciais diretamente no código
- Utilizar políticas de segurança adequadas no Supabase
- Implementar validação de entrada em todos os formulários

## Contatos e Recursos

- **Repositório**: https://github.com/greco92003/encartes-leia
- **Hospedagem**: https://encartes-leia.vercel.app
- **Planilha de Produtos**: [Link da Planilha](https://docs.google.com/spreadsheets/d/1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w)
- **Planilha de Saída**: [Link da Planilha](https://docs.google.com/spreadsheets/d/1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8)
