# Formulário de Encartes Atacado Léia

Aplicação web para criação e gerenciamento de encartes promocionais para o Atacado Léia.

## Funcionalidades

- Formulário para cadastro de produtos em encartes
- Busca e seleção de produtos com imagens
- Configuração de preços e promoções
- Persistência de dados no navegador
- Integração com Google Sheets para armazenamento dos dados

## Tecnologias Utilizadas

- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- Google Sheets API

## Desenvolvimento

Para executar o projeto localmente:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Variáveis de Ambiente

O projeto requer as seguintes variáveis de ambiente:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=email-da-conta-de-servico@google.com
GOOGLE_PRIVATE_KEY="chave-privada-da-conta-de-servico"
SPREADSHEET_ID=id-da-planilha-do-google-sheets
NODE_OPTIONS=--openssl-legacy-provider
```

## Arquivo de Credenciais

Para a integração com o Google Sheets, o projeto utiliza um arquivo de credenciais localizado em `app/api/credentials.json`. Este arquivo contém as credenciais da conta de serviço do Google e **não deve ser enviado para o repositório** (já está incluído no .gitignore).

Para configurar o arquivo de credenciais:

1. Acesse o [Console do Google Cloud](https://console.cloud.google.com/)
2. Selecione seu projeto
3. Vá para "IAM & Admin" > "Service Accounts"
4. Crie ou selecione uma conta de serviço
5. Gere uma nova chave JSON
6. Salve o arquivo como `app/api/credentials.json`

Exemplo de estrutura do arquivo:

```json
{
  "type": "service_account",
  "project_id": "seu-projeto",
  "private_key_id": "chave-privada-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "conta-de-servico@seu-projeto.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/conta-de-servico%40seu-projeto.iam.gserviceaccount.com"
}
```

## Deploy

O projeto está configurado para deploy na Vercel.
