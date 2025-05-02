# Configuração do Supabase para o Gerador de Encartes

Este documento descreve como configurar o Supabase para autenticação, armazenamento e gerenciamento de usuários no projeto Gerador de Encartes.

## Pré-requisitos

- Conta no Supabase (https://supabase.com)
- Projeto criado no Supabase
- Acesso ao SQL Editor do Supabase

## Configuração do Banco de Dados

1. Acesse o SQL Editor do seu projeto no Supabase
2. Execute o script SQL contido no arquivo `schema.sql` deste diretório

## Configuração da Autenticação

1. No Dashboard do Supabase, vá para "Authentication" > "Providers"
2. Habilite "Email" como método de autenticação
3. Desabilite "Confirm email" se desejar que os usuários não precisem confirmar o email

## Configuração do Armazenamento

1. No Dashboard do Supabase, vá para "Storage"
2. Crie um bucket chamado "imagens"
3. Marque a opção "Public bucket" para permitir acesso público às imagens

## Configuração do Usuário Admin

1. Crie um usuário com o email "greco92003@gmail.com" através da interface de autenticação do Supabase
2. Acesse o SQL Editor do Supabase
3. Execute o seguinte comando SQL para configurar o usuário como admin:

```sql
-- Atualizar o usuário para admin e aprovar
INSERT INTO profiles (id, email, name, role, is_approved)
VALUES ((SELECT id FROM auth.users WHERE email = 'greco92003@gmail.com'), 
        'greco92003@gmail.com', 'Greco Marques', 'admin', TRUE)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', is_approved = TRUE;

-- Verificar se a atualização foi bem-sucedida
SELECT * FROM profiles
WHERE email = 'greco92003@gmail.com';
```

## Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis de ambiente no seu projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://zqeypptzvwelnlkqbcco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

## Solução de Problemas

Se encontrar problemas com a autenticação ou armazenamento, verifique:

1. Se as políticas RLS estão configuradas corretamente
2. Se o usuário admin está configurado corretamente
3. Se o bucket "imagens" existe e está configurado como público
4. Se as variáveis de ambiente estão configuradas corretamente

Para mais detalhes, consulte o arquivo `TROUBLESHOOTING.md` neste diretório.
