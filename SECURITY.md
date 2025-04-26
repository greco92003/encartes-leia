# Guia de Segurança

Este documento fornece instruções sobre como gerenciar e regenerar credenciais para o projeto Gerador de Encartes.

## Regeneração de Credenciais

Se você suspeitar que alguma credencial foi comprometida, siga os passos abaixo para regenerá-la.

### Google Cloud Platform

1. Acesse o [Console do Google Cloud](https://console.cloud.google.com/)
2. Selecione o projeto "Encarte Atacado"
3. No menu lateral, vá para "APIs e Serviços" > "Credenciais"

#### Para regenerar a chave da conta de serviço:

1. Encontre a conta de serviço "encarte-atacado@encarte-atacado.iam.gserviceaccount.com"
2. Clique nos três pontos verticais à direita e selecione "Gerenciar chaves"
3. Clique em "ADICIONAR CHAVE" > "Criar nova chave"
4. Selecione o formato JSON e clique em "CRIAR"
5. Faça o download do arquivo JSON e guarde-o em um local seguro
6. Extraia a chave privada do arquivo JSON e atualize a variável de ambiente `GOOGLE_PRIVATE_KEY`

#### Para regenerar a chave de API:

1. Na seção "Chaves de API", encontre a chave existente
2. Clique nos três pontos verticais à direita e selecione "Regenerar chave"
3. Copie a nova chave e atualize a variável de ambiente `NEXT_PUBLIC_GOOGLE_API_KEY`

### Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.io/)
2. Selecione o projeto "imagens-leia"
3. No menu lateral, vá para "Configurações do Projeto" > "API"

#### Para regenerar a chave anônima:

1. Na seção "Chaves do Projeto", encontre a chave "anon public"
2. Clique em "Regenerar"
3. Copie a nova chave e atualize a variável de ambiente `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Atualização das Variáveis de Ambiente

Após regenerar as credenciais, você precisa atualizar as variáveis de ambiente em todos os ambientes onde a aplicação está sendo executada.

### Ambiente de Desenvolvimento Local

1. Edite o arquivo `.env.local` na raiz do projeto
2. Substitua as credenciais antigas pelas novas

### Ambiente de Produção (Vercel)

1. Acesse o [Dashboard da Vercel](https://vercel.com/)
2. Selecione o projeto "formulario-encarte-atacado"
3. Vá para "Settings" > "Environment Variables"
4. Atualize as variáveis de ambiente com as novas credenciais
5. Clique em "Save" e faça um novo deploy da aplicação

## Boas Práticas de Segurança

- Nunca cometa arquivos `.env.local` ou outros arquivos contendo credenciais no repositório
- Utilize o `.gitignore` para evitar vazamentos acidentais
- Restrinja o acesso às credenciais apenas a pessoas autorizadas
- Regenere as credenciais periodicamente como medida de segurança
- Configure permissões mínimas necessárias para cada serviço
- Monitore o uso das APIs para detectar atividades suspeitas
