# Guia de Configuração da API do Google Sheets

Este guia explica como configurar a API do Google Sheets para permitir que o aplicativo de formulário de encarte atualize a planilha do Google.

## 1. Criar um Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Criar Projeto" ou selecione um projeto existente
3. Dê um nome ao projeto (ex: "Encarte Atacado")
4. Clique em "Criar"

## 2. Ativar a API do Google Sheets

1. No menu lateral, vá para "APIs e Serviços" > "Biblioteca"
2. Pesquise por "Google Sheets API"
3. Clique na API do Google Sheets
4. Clique em "Ativar"

## 3. Criar Credenciais de Conta de Serviço

1. No menu lateral, vá para "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "Conta de serviço"
3. Dê um nome à conta de serviço (ex: "encarte-atacado")
4. Opcionalmente, adicione uma descrição
5. Clique em "Criar e Continuar"
6. Na seção "Conceder a esta conta de serviço acesso ao projeto", selecione o papel "Editor"
7. Clique em "Continuar" e depois em "Concluído"

## 4. Criar Chave para a Conta de Serviço

1. Na lista de contas de serviço, clique na conta que você acabou de criar
2. Vá para a aba "Chaves"
3. Clique em "Adicionar Chave" > "Criar nova chave"
4. Selecione o formato "JSON"
5. Clique em "Criar"
6. O arquivo JSON será baixado automaticamente para o seu computador

## 5. Compartilhar a Planilha com a Conta de Serviço

1. Abra a planilha do Google Sheets que você deseja atualizar
2. Clique no botão "Compartilhar" no canto superior direito
3. No campo "Adicionar pessoas e grupos", cole o endereço de e-mail da conta de serviço (você pode encontrá-lo no arquivo JSON baixado, no campo "client_email")
4. Certifique-se de dar permissão de "Editor"
5. Clique em "Enviar"

## 6. Configurar as Variáveis de Ambiente no Aplicativo

1. Abra o arquivo `.env.local` no diretório raiz do aplicativo
2. Atualize as seguintes variáveis:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-email-da-conta-de-servico@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSua chave privada aqui\n-----END PRIVATE KEY-----\n"
SPREADSHEET_ID=1Nqad0WGOn2txowApW88PVuFeSkoxzkYCXze09oCelp8
```

- Para `GOOGLE_SERVICE_ACCOUNT_EMAIL`, use o valor do campo "client_email" do arquivo JSON
- Para `GOOGLE_PRIVATE_KEY`, use o valor do campo "private_key" do arquivo JSON
- Para `SPREADSHEET_ID`, use o ID da sua planilha (você pode encontrá-lo na URL da planilha, entre "/d/" e "/edit")

## 7. Reiniciar o Aplicativo

Após configurar as variáveis de ambiente, reinicie o aplicativo para que as alterações tenham efeito.

## Solução de Problemas

Se você encontrar problemas ao tentar atualizar a planilha, verifique:

1. Se a API do Google Sheets está ativada para o seu projeto
2. Se a conta de serviço tem permissão de "Editor" na planilha
3. Se as variáveis de ambiente estão configuradas corretamente
4. Se o ID da planilha está correto

Para mais informações, consulte a [documentação oficial da API do Google Sheets](https://developers.google.com/sheets/api/guides/concepts).
