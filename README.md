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
```

## Deploy

O projeto está configurado para deploy na Vercel.
