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

## Prevenção de Vazamentos com GitGuardian Shield

Este projeto utiliza o GitGuardian Shield (ggshield) para prevenir vazamentos de credenciais. O ggshield é uma ferramenta que verifica o código em busca de segredos antes que eles sejam commitados.

### Configuração do GitGuardian Shield

1. Crie uma conta no [GitGuardian](https://dashboard.gitguardian.com/auth/signup)
2. Instale o ggshield:
   ```bash
   pip install ggshield
   ```
3. Autentique-se com o GitGuardian:
   ```bash
   ggshield auth login
   ```
4. Configure o hook de pre-commit:
   ```bash
   ggshield secret scan pre-commit
   ```

### Configuração no CI/CD

Para configurar o GitGuardian no GitHub Actions:

1. Obtenha uma API key no [dashboard do GitGuardian](https://dashboard.gitguardian.com/api)
2. Adicione a API key como um segredo no repositório do GitHub:
   - Vá para "Settings" > "Secrets" > "New repository secret"
   - Nome: `GITGUARDIAN_API_KEY`
   - Valor: sua API key do GitGuardian

O workflow já está configurado no arquivo `.github/workflows/secret-detection.yml`.

## Boas Práticas de Segurança

- Nunca cometa arquivos `.env.local` ou outros arquivos contendo credenciais no repositório
- Utilize o `.gitignore` para evitar vazamentos acidentais
- Use o GitGuardian Shield para verificar commits antes de enviá-los
- Restrinja o acesso às credenciais apenas a pessoas autorizadas
- Regenere as credenciais periodicamente como medida de segurança
- Configure permissões mínimas necessárias para cada serviço
- Monitore o uso das APIs para detectar atividades suspeitas
- Mantenha o ggshield atualizado com `pip upgrade ggshield`
