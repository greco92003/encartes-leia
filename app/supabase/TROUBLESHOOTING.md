# Guia de Solução de Problemas do Supabase

Este guia ajudará a resolver problemas comuns relacionados ao Supabase no sistema Gerador de Encartes.

## Problema: "new row violates row-level security policy"

Se você estiver recebendo este erro ao tentar fazer upload de imagens, siga estas etapas:

1. Verifique se você está autenticado como um usuário com permissões adequadas (admin)
2. Execute o script `schema.sql` novamente para garantir que todas as políticas RLS estejam configuradas corretamente
3. Verifique se o bucket "imagens" existe e está configurado corretamente

Para verificar e corrigir as políticas RLS, execute:

```sql
-- Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Recriar políticas se necessário
CREATE POLICY "Allow authenticated users to upload files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'imagens' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'imagens');

CREATE POLICY "Allow authenticated users to update their own files" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'imagens' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own files" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'imagens' AND owner = auth.uid());
```

## Problema: "Invalid login credentials"

Se você estiver recebendo o erro "Invalid login credentials" ao tentar fazer login, siga estas etapas:

1. Verifique se o usuário existe no Supabase (Authentication > Users)
2. Verifique se a senha está correta
3. Se necessário, redefina a senha do usuário

## Problema: Tabela profiles não existe

Se a tabela profiles não existir, execute o script `schema.sql` para criá-la:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can read their own profile" 
  ON profiles FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (id = auth.uid());
```

## Problema: Usuário admin não tem permissões

Se o usuário admin não tiver permissões para acessar o painel admin, verifique se ele está configurado corretamente:

```sql
-- Verificar se o usuário existe
SELECT * FROM auth.users WHERE email = 'greco92003@gmail.com';

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

## Problema: Bucket não existe

Se o bucket "imagens" não existir, crie-o através do Dashboard do Supabase:

1. Acesse o Dashboard do Supabase
2. Vá para "Storage"
3. Clique em "New Bucket"
4. Nomeie o bucket como "imagens"
5. Marque a opção "Public bucket" para permitir acesso público às imagens
