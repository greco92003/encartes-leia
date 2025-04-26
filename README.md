# Gerador de Encartes - Atacado Léia

Aplicação web para criação e gerenciamento de encartes promocionais para o Atacado Léia.

## Funcionalidades

- Formulário para cadastro de produtos em encartes
- Busca e seleção de produtos com imagens
- Configuração de preços e promoções
- Persistência de dados no navegador
- Integração com Google Sheets para armazenamento dos dados
- Upload de imagens para o Supabase
- Diferentes tipos de encartes: Fim de Semana, Especial das Carnes, Horti-Fruti

## Tecnologias Utilizadas

- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- Google Sheets API
- Supabase Storage

## Configuração do Ambiente

### Variáveis de Ambiente

Para configurar as variáveis de ambiente necessárias para a aplicação, siga os passos abaixo:

1. Copie o arquivo `.env.local.example` para `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

2. Edite o arquivo `.env.local` com suas credenciais:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Email da conta de serviço do Google
   - `GOOGLE_PRIVATE_KEY`: Chave privada da conta de serviço do Google
   - `SPREADSHEET_ID`: ID da planilha do Google Sheets
   - `TEST_MODE`: Define se a aplicação está em modo de teste (true/false)
   - `NEXT_PUBLIC_GOOGLE_API_KEY`: Chave da API do Google para acesso público
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase

### Segurança

**IMPORTANTE**: Nunca cometa arquivos `.env.local` ou outros arquivos contendo credenciais no repositório. Eles estão incluídos no `.gitignore` para evitar vazamentos acidentais.

#### GitGuardian Shield (ggshield)

Este projeto utiliza o GitGuardian Shield para prevenir vazamentos de credenciais. Para configurar o ggshield em seu ambiente de desenvolvimento:

1. Instale o ggshield:

   ```bash
   pip install ggshield
   ```

2. Autentique-se com o GitGuardian:

   ```bash
   ggshield auth login
   ```

3. Configure o hook de pre-commit:

   ```bash
   ggshield secret scan pre-commit
   ```

4. Para verificar se há segredos no repositório:

   ```bash
   ggshield secret scan repo .
   ```

5. Mantenha o ggshield atualizado:
   ```bash
   pip upgrade ggshield
   ```

O projeto também inclui uma configuração de pre-commit e um workflow do GitHub Actions para verificar automaticamente os commits e pull requests.

## Desenvolvimento

Para executar o projeto localmente:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar servidor de produção
npm start
```

## Estrutura do Projeto

- `/app`: Código principal da aplicação Next.js
- `/public`: Arquivos estáticos
- `/upload-imagens`: Módulo para upload de imagens

## Deploy

O projeto está configurado para deploy na Vercel. Certifique-se de configurar as variáveis de ambiente no painel da Vercel antes de fazer o deploy.
